import { isArray, resolve } from '@primeuix/utils';
import { computed, mergeProps, nextTick, onMounted, reactive, toValue, watch } from 'vue';

function tryOnMounted(fn, sync = true) {
    if (getCurrentInstance()) onMounted(fn);
    else if (sync) fn();
    else nextTick(fn);
}

export const useForm = (options = {}) => {
    const states = reactive({});
    const fields = reactive({});
    const valid = computed(() => Object.values(states).every((field) => !field.invalid));

    const getInitialState = (field, initialValue) => {
        return {
            value: initialValue ?? options.initialValues?.[field],
            touched: false,
            dirty: false,
            pristine: true,
            valid: true,
            invalid: false,
            error: null,
            errors: []
        };
    };

    const isFieldValidate = (field, validateOn) => {
        const value = resolve(validateOn, field);

        return value === true || (isArray(value) && value.includes(field));
    };

    const validateOn = async (option, defaultValue) => {
        let results = {};

        isArray(options[option]) ? options[option].forEach(async (field) => (results = await validate(field))) : (options[option] ?? defaultValue) && (results = await validate());

        const field = Object.keys(fields).find((field) => fields[field]?.options?.[option]);
        field && (results = await validate(field));

        return results;
    };

    const validateFieldOn = (field, fieldOptions, option, defaultValue) => {
        (fieldOptions?.[option] ?? isFieldValidate(field, options[option] ?? defaultValue)) && validate(field);
    };

    const defineField = (field, fieldOptions) => {
        states[field] ||= getInitialState(field, fieldOptions?.initialValue);

        const props = mergeProps(resolve(fieldOptions, states[field])?.props, resolve(fieldOptions?.props, states[field]), {
            name: field,
            onBlur: () => {
                states[field].touched = true;
                validateFieldOn(field, fieldOptions, 'validateOnBlur');
            },
            onInput: (event) => {
                states[field].value = event.hasOwnProperty('value') ? event.value : event.target.value;
            },
            onChange: (event) => {
                states[field].value = event.hasOwnProperty('value') ? event.value : event.target.type === 'checkbox' || event.target.type === 'radio' ? event.target.checked : event.target.value;
            },
            onInvalid: (errors) => {
                states[field].invalid = true;
                states[field].errors = errors;
                states[field].error = errors?.[0] ?? null;
            }
        });

        fields[field] = { props, states: states[field], options: fieldOptions };

        watch(
            () => states[field].value,
            (newValue, oldValue) => {
                if (states[field].pristine) {
                    states[field].pristine = false;
                }

                if (newValue !== oldValue) {
                    states[field].dirty = true;
                }

                validateFieldOn(field, fieldOptions, 'validateOnValueUpdate', true);
            }
        );

        return [states[field], props];
    };

    const handleSubmit = (callback) => {
        return async (event) => {
            const results = await validateOn('validateOnSubmit', true);

            return callback({
                originalEvent: event,
                valid: toValue(valid),
                states: toValue(states),
                reset,
                ...results
            });
        };
    };

    const validate = async (field) => {
        const resolverOptions = Object.entries(states).reduce(
            (acc, [key, val]) => {
                acc.names.push(key);
                acc.values[key] = val.value;

                return acc;
            },
            { names: [], values: {} }
        );

        const result = (await options.resolver?.(resolverOptions)) ?? {};

        result.errors ??= {};

        for (const [fieldName, fieldInst] of Object.entries(fields)) {
            const fieldResolver = fieldInst.options?.resolver;

            fieldResolver && (result.errors[fieldName] = await fieldResolver({ value: fieldInst.states.value, name: fieldName })?.errors);

            if (fieldName === field || !field) {
                const errors = result.errors[fieldName] ?? [];
                //const value = result.values?.[fieldName] ?? states[sField].value;

                states[fieldName].invalid = errors.length > 0;
                states[fieldName].valid = !states[fieldName].invalid;
                states[fieldName].errors = errors;
                states[fieldName].error = errors?.[0] ?? null;
                //states[fieldName].value = value;
            }
        }

        return result;
    };

    const reset = () => {
        Object.keys(states).forEach((field) => (fields[field].states = states[field] = getInitialState(field, fields[field]?.options?.initialValue)));
    };

    const validateOnMounted = () => {
        validateOn('validateOnMount');
    };

    tryOnMounted(validateOnMounted);

    return {
        defineField,
        handleSubmit,
        validate,
        reset,
        valid,
        states,
        fields
    };
};
