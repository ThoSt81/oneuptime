import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';
import ClickOutside from 'react-click-outside';
import { Validate } from '../../config';
import { reduxForm, Field } from 'redux-form';
import { updateWebHook } from '../../actions/webHook';
import ShouldRender from '../basic/ShouldRender';
import { FormLoader } from '../basic/Loader';
import { RenderField } from '../basic/RenderField';
import { ValidateField } from '../../config';
import MultiSelectDropDown from '../basic/MultiSelectDropDown';
import { RenderSelect } from '../basic/RenderSelect';

function validate(values) {
    const errors = {};

    if (!Validate.url(values.endpoint)) {
        errors.endpoint = 'Webhook url is required!';
    }

    return errors;
}

class EditWebHook extends React.Component {
    state = {
        monitorError: null,
        selectedProjects: [],
        selectedComponents: [],
        selectedMonitors: [],
        selectData: [],
    };
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);

        this.formatData();
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    submitForm = values => {
        const {
            updateWebHook,
            closeThisDialog,
            data,
            currentProject,
            monitor,
        } = this.props;

        const postObj = {};
        const { selectAllMonitors } = values;
        const monitorId = data.currentMonitorId;
        let monitors = [];
        const allMonitors = monitor.monitorsList.monitors
            .map(monitor => monitor.monitors)
            .flat();

        if (selectAllMonitors) {
            monitors = allMonitors.map(monitor => monitor._id);
        }
        if (
            this.state.selectedMonitors &&
            this.state.selectedMonitors.length > 0
        ) {
            monitors = this.state.selectedMonitors;
        }
        if (monitorId) {
            monitors = [monitorId];
        }
        if (!monitors || (monitors && monitors.length === 0)) {
            this.setState({
                monitorError: 'No monitor was selected',
            });
            return;
        }
        postObj.endpoint = values.endpoint;
        postObj.endpointType = values.endpointType;
        postObj.type = 'webhook';
        postObj.monitors = monitors;
        postObj.incidentCreated = values.incidentCreated
            ? values.incidentCreated
            : false;
        postObj.incidentResolved = values.incidentResolved
            ? values.incidentResolved
            : false;
        postObj.incidentAcknowledged = values.incidentAcknowledged
            ? values.incidentAcknowledged
            : false;

        const isDuplicate = postObj.monitors
            ? postObj.monitors.length === new Set(postObj.monitors).size
                ? false
                : true
            : false;

        if (isDuplicate) {
            this.setState({
                monitorError: 'Duplicate monitor selection found',
            });
            postObj.monitors = [];
            return;
        }
        updateWebHook(currentProject._id, data._id, postObj).then(() => {
            if (this.props.newWebHook && !this.props.newWebHook.error) {
                closeThisDialog();
            }
        });
    };

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeThisDialog();
            case 'Enter':
                return document.getElementById('updateWebhook').click();
            default:
                return false;
        }
    };

    formatData = () => {
        const monitors = this.props.monitorsList;
        const hash = {};

        monitors.forEach(monitor => {
            const projectId = monitor.projectId._id || monitor.projectId;
            const componentId = monitor.componentId._id || monitor.componentId;
            if (!hash[projectId]) {
                hash[projectId] = {
                    projectName: monitor.projectId?.name,
                    projectId,
                    components: [
                        {
                            componentName: monitor.componentId?.name,
                            componentId,
                            monitors: [
                                {
                                    monitorName: monitor.name,
                                    monitorId: monitor._id,
                                },
                            ],
                        },
                    ],
                };
            } else {
                let monitorAdded = false;
                hash[projectId] = {
                    ...hash[projectId],
                    components: hash[projectId].components.map(componentObj => {
                        if (componentObj.componentId === componentId) {
                            const newMonitor = {
                                monitorName: monitor.name,
                                monitorId: monitor._id,
                            };

                            componentObj.monitors = [
                                ...componentObj.monitors,
                                newMonitor,
                            ];

                            monitorAdded = true;
                        }

                        return componentObj;
                    }),
                };

                if (!monitorAdded) {
                    const componentData = {
                        componentName: monitor.componentId.name,
                        componentId,
                        monitors: [
                            {
                                monitorName: monitor.name,
                                monitorId: monitor._id,
                            },
                        ],
                    };
                    hash[projectId] = {
                        ...hash[projectId],
                        components: [
                            ...hash[projectId].components,
                            componentData,
                        ],
                    };

                    monitorAdded = true;
                }
            }
        });

        const data = [];
        for (const [, value] of Object.entries(hash)) {
            data.push(value);
        }

        this.setState({
            selectData: data,
            selectedMonitors: this.props.initialValues.monitors || [],
        });
    };

    updateState = (value, key) => {
        this.setState(prevState => {
            let currentValue = prevState[key];

            if (currentValue.includes(value)) {
                currentValue = currentValue.filter(val => val !== value);
                this.updateMultipleState(value, key, currentValue);

                return {
                    [key]: currentValue,
                };
            }

            currentValue = [...currentValue, value];
            this.updateMultipleState(value, key, currentValue);

            return {
                [key]: currentValue,
            };
        });
    };

    updateMultipleState = (id, key, databank) => {
        if (key === 'selectedProjects' && databank.includes(id)) {
            const monitorIds = [];
            const componentIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.projectId._id || monitor.projectId) === id) {
                    monitorIds.push(monitor._id);
                    componentIds.push(
                        monitor.componentId._id || monitor.componentId
                    );
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: Array.from(
                    new Set([...prevState.selectedMonitors, ...monitorIds])
                ),
                selectedComponents: Array.from(
                    new Set([...prevState.selectedComponents, ...componentIds])
                ),
            }));
        }

        if (key === 'selectedProjects' && !databank.includes(id)) {
            const monitorIds = [];
            const componentIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.projectId._id || monitor.projectId) === id) {
                    monitorIds.push(monitor._id);
                    componentIds.push(
                        monitor.componentId._id || monitor.componentId
                    );
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: prevState.selectedMonitors.filter(
                    monitorId => !monitorIds.includes(monitorId)
                ),
                selectedComponents: prevState.selectedComponents.filter(
                    componentId => !componentIds.includes(componentId)
                ),
            }));
        }

        if (key === 'selectedComponents' && databank.includes(id)) {
            const monitorIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.componentId._id || monitor.componentId) === id) {
                    monitorIds.push(monitor._id);
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: Array.from(
                    new Set([...prevState.selectedMonitors, ...monitorIds])
                ),
            }));
        }

        if (key === 'selectedComponents' && !databank.includes(id)) {
            const monitorIds = [];
            this.props.monitorsList.forEach(monitor => {
                if ((monitor.componentId._id || monitor.componentId) === id) {
                    monitorIds.push(monitor._id);
                }
            });

            return this.setState(prevState => ({
                selectedMonitors: prevState.selectedMonitors.filter(
                    monitorId => !monitorIds.includes(monitorId)
                ),
            }));
        }
    };

    render() {
        const { handleSubmit, closeThisDialog, data } = this.props;

        const { formValues } = this.props;
        const {
            selectedProjects,
            selectedComponents,
            selectedMonitors,
            selectData,
        } = this.state;

        const monitorList = [];

        const allMonitors = this.props.monitor.monitorsList.monitors
            .map(monitor => monitor.monitors)
            .flat();
        if (allMonitors && allMonitors.length > 0) {
            allMonitors.map(monitor =>
                monitorList.push({
                    value: monitor._id,
                    label: monitor.name,
                })
            );
        }

        return (
            <div
                className="ModalLayer-contents"
                tabIndex="-1"
                style={{ marginTop: '40px' }}
            >
                <div className="bs-BIM">
                    <div className="bs-Modal" style={{ width: 600 }}>
                        <ClickOutside onClickOutside={closeThisDialog}>
                            <div className="bs-Modal-header">
                                <div
                                    className="bs-Modal-header-copy"
                                    style={{
                                        marginBottom: '10px',
                                        marginTop: '10px',
                                    }}
                                >
                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                        <span>Update Webhook</span>
                                    </span>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit(this.submitForm)}>
                                <div className="bs-Modal-content">
                                    <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="endpoint"
                                                    >
                                                        <span>
                                                            Endpoint URL
                                                        </span>
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
                                                        <div
                                                            className="bs-Fieldset-field"
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <Field
                                                                component={
                                                                    RenderField
                                                                }
                                                                name="endpoint"
                                                                placeholder="Enter Webhook URL"
                                                                id="endpoint"
                                                                type="url"
                                                                className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                style={{
                                                                    width:
                                                                        '100%',
                                                                    padding:
                                                                        '3px 5px',
                                                                }}
                                                                autoFocus={true}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                        <ShouldRender
                                            if={!data.currentMonitorId}
                                        >
                                            <fieldset className="Margin-bottom--16">
                                                <div className="bs-Fieldset-rows">
                                                    <div
                                                        className="bs-Fieldset-row Margin-bottom--12 Padding-left--0"
                                                        style={{ padding: 0 }}
                                                    >
                                                        <label
                                                            className="bs-Fieldset-label Text-align--left"
                                                            htmlFor="monitorId"
                                                        >
                                                            <span>
                                                                Monitors
                                                            </span>
                                                        </label>
                                                        {formValues &&
                                                            formValues.selectAllMonitors && (
                                                                <div
                                                                    className="bs-Fieldset-row"
                                                                    style={{
                                                                        padding: 0,
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="bs-Fieldset-fields bs-Fieldset-fields--wide"
                                                                        style={{
                                                                            padding: 0,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="Box-root"
                                                                            style={{
                                                                                height:
                                                                                    '5px',
                                                                            }}
                                                                        ></div>
                                                                        <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                                                            <label
                                                                                className="Checkbox"
                                                                                htmlFor="selectAllMonitorsBox"
                                                                            >
                                                                                <Field
                                                                                    component="input"
                                                                                    type="checkbox"
                                                                                    name="selectAllMonitors"
                                                                                    className="Checkbox-source"
                                                                                    id="selectAllMonitorsBox"
                                                                                />
                                                                                <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                                                                    <div className="Checkbox-target Box-root">
                                                                                        <div className="Checkbox-color Box-root"></div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="Checkbox-label Box-root Margin-left--8">
                                                                                    <span className="Text-color--default Text-display--inline Text-fontSize--14 Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                                        <span>
                                                                                            All
                                                                                            Monitors
                                                                                            Selected
                                                                                        </span>
                                                                                    </span>
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        {formValues &&
                                                            !formValues.selectAllMonitors && (
                                                                <div className="bs-Fieldset-fields">
                                                                    <div
                                                                        className="bs-Fieldset-field"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                        }}
                                                                    >
                                                                        <MultiSelectDropDown
                                                                            ready={
                                                                                true
                                                                            }
                                                                            value={`${
                                                                                selectedMonitors.length
                                                                            } Monitor${
                                                                                selectedMonitors.length >
                                                                                0
                                                                                    ? 's'
                                                                                    : ''
                                                                            } Selected`}
                                                                            updateState={
                                                                                this
                                                                                    .updateState
                                                                            }
                                                                            selectedProjects={
                                                                                selectedProjects
                                                                            }
                                                                            selectedComponents={
                                                                                selectedComponents
                                                                            }
                                                                            selectedMonitors={
                                                                                selectedMonitors
                                                                            }
                                                                            options={
                                                                                selectData
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </fieldset>
                                        </ShouldRender>
                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="monitorId"
                                                    >
                                                        <span>
                                                            Endpoint Type
                                                        </span>
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
                                                        <div
                                                            className="bs-Fieldset-field"
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <Field
                                                                component={
                                                                    RenderSelect
                                                                }
                                                                name="endpointType"
                                                                id="endpointType"
                                                                placeholder="Select endpoint type"
                                                                disabled={
                                                                    this.props
                                                                        .newWebHook
                                                                        .requesting
                                                                }
                                                                validate={
                                                                    ValidateField.select
                                                                }
                                                                style={{
                                                                    width:
                                                                        '100%',
                                                                }}
                                                                options={[
                                                                    {
                                                                        value:
                                                                            '',
                                                                        label:
                                                                            'Select endpoint type',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'get',
                                                                        label:
                                                                            'GET',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'post',
                                                                        label:
                                                                            'POST',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'put',
                                                                        label:
                                                                            'PUT',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'patch',
                                                                        label:
                                                                            'PATCH',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'delete',
                                                                        label:
                                                                            'DELETE',
                                                                    },
                                                                ]}
                                                                className="db-select-nw db-MultiSelect-input webhook-select"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>

                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="monitorId"
                                                    >
                                                        <span></span>
                                                    </label>
                                                    <div
                                                        className="bs-Fieldset-fields"
                                                        style={{
                                                            paddingTop: '6px',
                                                        }}
                                                    >
                                                        <div className="bs-Fieldset-field">
                                                            <label
                                                                className="Checkbox"
                                                                style={{
                                                                    marginRight:
                                                                        '12px',
                                                                }}
                                                            >
                                                                <Field
                                                                    component="input"
                                                                    type="checkbox"
                                                                    name="incidentCreated"
                                                                    className="Checkbox-source"
                                                                    id="incidentCreated"
                                                                />
                                                                <div className="Checkbox-box Box-root Margin-right--2">
                                                                    <div className="Checkbox-target Box-root">
                                                                        <div className="Checkbox-color Box-root"></div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="Box-root"
                                                                    style={{
                                                                        paddingLeft:
                                                                            '5px',
                                                                    }}
                                                                >
                                                                    <label>
                                                                        <span>
                                                                            Ping
                                                                            when
                                                                            incident
                                                                            is
                                                                            Created
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="monitorId"
                                                    >
                                                        <span></span>
                                                    </label>
                                                    <div
                                                        className="bs-Fieldset-fields"
                                                        style={{
                                                            paddingTop: '6px',
                                                        }}
                                                    >
                                                        <div className="bs-Fieldset-field">
                                                            <label
                                                                className="Checkbox"
                                                                style={{
                                                                    marginRight:
                                                                        '12px',
                                                                }}
                                                            >
                                                                <Field
                                                                    component="input"
                                                                    type="checkbox"
                                                                    name="incidentAcknowledged"
                                                                    className="Checkbox-source"
                                                                    id="incidentAcknowledged"
                                                                />
                                                                <div className="Checkbox-box Box-root Margin-right--2">
                                                                    <div className="Checkbox-target Box-root">
                                                                        <div className="Checkbox-color Box-root"></div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="Box-root"
                                                                    style={{
                                                                        paddingLeft:
                                                                            '5px',
                                                                    }}
                                                                >
                                                                    <label>
                                                                        <span>
                                                                            Ping
                                                                            when
                                                                            incident
                                                                            is
                                                                            Acknowledged
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>

                                        <fieldset className="Margin-bottom--16">
                                            <div className="bs-Fieldset-rows">
                                                <div
                                                    className="bs-Fieldset-row"
                                                    style={{ padding: 0 }}
                                                >
                                                    <label
                                                        className="bs-Fieldset-label Text-align--left"
                                                        htmlFor="monitorId"
                                                    >
                                                        <span></span>
                                                    </label>
                                                    <div
                                                        className="bs-Fieldset-fields"
                                                        style={{
                                                            paddingTop: '6px',
                                                        }}
                                                    >
                                                        <div className="bs-Fieldset-field">
                                                            <label
                                                                className="Checkbox"
                                                                style={{
                                                                    marginRight:
                                                                        '12px',
                                                                }}
                                                            >
                                                                <Field
                                                                    component="input"
                                                                    type="checkbox"
                                                                    name="incidentResolved"
                                                                    className="Checkbox-source"
                                                                    id="incidentResolved"
                                                                />
                                                                <div className="Checkbox-box Box-root Margin-right--2">
                                                                    <div className="Checkbox-target Box-root">
                                                                        <div className="Checkbox-color Box-root"></div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="Box-root"
                                                                    style={{
                                                                        paddingLeft:
                                                                            '5px',
                                                                    }}
                                                                >
                                                                    <label>
                                                                        <span>
                                                                            Ping
                                                                            when
                                                                            incident
                                                                            is
                                                                            Resolved
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>
                                    </div>
                                </div>
                                <div className="bs-Modal-footer">
                                    <div className="bs-Modal-footer-actions">
                                        <ShouldRender
                                            if={
                                                this.props.newWebHook &&
                                                this.props.newWebHook.error
                                            }
                                        >
                                            <div className="bs-Tail-copy">
                                                <div
                                                    className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                                    style={{
                                                        marginTop: '10px',
                                                    }}
                                                >
                                                    <div className="Box-root Margin-right--8">
                                                        <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                                    </div>
                                                    <div className="Box-root">
                                                        <span
                                                            style={{
                                                                color: 'red',
                                                            }}
                                                        >
                                                            {
                                                                this.props
                                                                    .newWebHook
                                                                    .error
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </ShouldRender>
                                        <button
                                            className="bs-Button bs-DeprecatedButton btn__modal"
                                            type="button"
                                            onClick={closeThisDialog}
                                        >
                                            <span>Cancel</span>
                                            <span className="cancel-btn__keycode">
                                                Esc
                                            </span>
                                        </button>
                                        <button
                                            className="bs-Button bs-DeprecatedButton bs-Button--blue btn__modal"
                                            disabled={
                                                this.props.newWebHook &&
                                                this.props.newWebHook.requesting
                                            }
                                            type="submit"
                                            id="updateWebhook"
                                        >
                                            {this.props.newWebHook &&
                                                !this.props.newWebHook
                                                    .requesting && (
                                                    <>
                                                        <span>Update</span>
                                                        <span className="create-btn__keycode">
                                                            <span className="keycode__icon keycode__icon--enter" />
                                                        </span>
                                                    </>
                                                )}
                                            {this.props.newWebHook &&
                                                this.props.newWebHook
                                                    .requesting && (
                                                    <FormLoader />
                                                )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </ClickOutside>
                    </div>
                </div>
            </div>
        );
    }
}

EditWebHook.displayName = 'EditWebHook';

EditWebHook.propTypes = {
    currentProject: PropTypes.object,
    updateWebHook: PropTypes.func.isRequired,
    closeThisDialog: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    monitor: PropTypes.object,
    newWebHook: PropTypes.object,
    data: PropTypes.object.isRequired,
    formValues: PropTypes.object,
    monitorsList: PropTypes.array,
    initialValues: PropTypes.object,
};

const NewEditWebHook = compose(
    reduxForm({
        form: 'NewEditWebHook',
        validate,
        enableReinitialize: true,
        destroyOnUnmount: true,
        keepDirtyOnReinitialize: true,
        updateUnregisteredFields: true,
    })
)(EditWebHook);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            updateWebHook,
        },
        dispatch
    );

const mapStateToProps = (state, props) => {
    const currentMonitorValue = { value: '', label: 'Select monitor' };

    if (props.data && props.data.monitorId) {
        currentMonitorValue.label = props.data.monitorId.name;
        currentMonitorValue.value = props.data.monitorId._id;
    }
    const monitors = props.data.data.monitors.map(monitor => monitor.monitorId);

    const monitorsList = [];
    state.monitor.monitorsList.monitors.forEach(item => {
        item.monitors.forEach(m => {
            monitorsList.push(m);
        });
    });

    return {
        webhook: state.webhook,
        monitor: state.monitor,
        currentProject: state.project.currentProject,
        newWebHook: state.webHooks.updateWebHook,
        formValues:
            state.form.NewEditWebHook && state.form.NewEditWebHook.values,
        initialValues: {
            endpoint: props.data.data.endpoint,
            selectMonitors: true,
            monitors,
            endpointType: props.data.data.endpointType,
            monitorId: currentMonitorValue.value,
            incidentCreated: props.data.notificationOptions.incidentCreated,
            incidentResolved: props.data.notificationOptions.incidentResolved,
            incidentAcknowledged:
                props.data.notificationOptions.incidentAcknowledged,
        },
        monitorsList,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewEditWebHook);
