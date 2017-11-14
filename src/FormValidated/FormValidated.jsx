import React, { Component } from "react";
import { array, func, object } from 'prop-types';
import update from "immutability-helper";

import getErrorMessage from "./getErrorMessage";
import { addPropsToChildren } from "./addpropstochildren";
import { getInitialState, addCustomValidation, addOnBlur, addOnChange } from "./helpers";


class FormValidated extends Component {

    state = getInitialState(this.props.fieldList, this.props.initialValues);

    static propTypes = {
        fieldList: array.isRequired,
        onSubmit: func.isRequired,
        onBlur: object,
        onChange: object,
        initialValues: object,
        customValidation: object
    };

    static defaultProps = {
        onBlur: {},
        onChange: {},
        initialValues: {},
        customValidation: {}
    };

    updateField = (fieldId, newState) => {
        this.setState(prevState =>
            update(prevState, {
                fields: { [fieldId]: { $merge: newState }} 
            })
        );
    };

    validateField = (fieldId, field) => {
        return addCustomValidation(fieldId, field, this.props.customValidation)
            .then(field => {
                this.updateField(fieldId, {
                    valid: field.validity.valid,
                    errorMessage: getErrorMessage(field)
                });
                return field.validity.valid;
            })
    };

    submitForm = e => {
        e.preventDefault();

        let isValid = true;

        const validations = Object.keys(this.refs).map(fieldId => {
            const field = this.refs[fieldId];
            return this.validateField(fieldId, field)
                .then(valid => {
                    if (!valid) {
                        isValid = false;
                    }
                });
        });

        Promise.all(validations)
            .then(() => {
                if (isValid) {
                    let values = {};
                    Object.keys(this.state.fields).forEach(key => {
                        values[key] = this.state.fields[key].value;
                    });
                    this.props.onSubmit(values);
                }
            })
    };




    inputChange = e => {
        const field = e.target;
        this.updateField(field.id, {value: field.value});
        if (!this.state.fields[field.id].valid) {
            this.validateField(field.id, field);
        }
        addOnChange(field.id, field, this.props.onChange);
    };

    inputBlur = e => {
        const field = e.target;
        this.validateField(field.id, field);
        addOnBlur(field.id, field, this.props.onBlur);
    };

    radioChange = e => {
        const field = e.target;
        this.updateField(field.name, {value: field.value});
        this.validateField(field.name, field);
        addOnChange(field.name, field, this.props.onChange);
    };

    checkboxChange = e => {
        const field = e.target;
        this.updateField(field.id, {value: field.checked});
        this.validateField(field.id, field);
        addOnChange(field.id, field, this.props.onChange);
    };

    handles = {
        checkboxChange: this.checkboxChange,
        inputBlur: this.inputBlur,
        inputChange: this.inputChange,
        radioChange: this.radioChange
    };


    componentWillReceiveProps(nextProps) {

        // TODO: Mulig optimaliseringP Kontroller gamle mot nye props.

        let newState = getInitialState(nextProps.fieldList, nextProps.initialValues) 

        this.setState(prevState => {

            Object.keys(newState.fields).forEach(key => {
                if (prevState.fields[key]) {
                    newState.fields[key] = prevState.fields[key]
                }
            });

            return update(prevState, {
                fields: { $set: newState.fields }
            });
        });
    }


    render() {

        // TODO: Nå rendres hele skjemaet på nytt for hver endring i state. 
        // Kan dette optimaliseres?
        // State må endres pga. constraints
        // console.log('Remnder: ' + Date.now());
        // Kan flytte addPropsToChildren til ComponentWillMount. Referer til funksjon som henter state, 
        // i stedet for å hente verdien.


        return (
            <form onSubmit={this.submitForm} noValidate>
                {addPropsToChildren(this.props.children, this.state.fields, this.handles)}
            </form>
        );
    }
}

export default FormValidated;
