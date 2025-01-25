/**
 * Copyright (c) 1998-2023, Oracle NetSuite, Inc.
 * 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Oracle NetSuite.
 *
 * Version          Date          Author               Remarks
 * 1.0              14 Feb 2023   christian.grande     Initial version
 * 1.0              13 Mar 2023   mteodorojr           Add print button
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'N/ui/message'], (runtime, message) => {

    const PARAMS_IDS = {
        bsoStatusComplete: {
            id: 'custscript_ns_bso_status_complete',
            optional: false
        },
        buttonLabel: {
            id: 'custscript_ns_button_label',
            optional: false
        },
        buttonPrint: {
            id: 'custscript_ns_btn_print_contract_lbl',
            optional: false
        },
        slScriptId: {
            id: 'custscript_ns_sl_script_id',
            optional: false
        },
        slDeployId: {
            id: 'custscript_ns_sl_deploy_id',
            optional: false
        },
        slPrintScriptId: {
            id: 'custscript_ns_sl_print_script_id',
            optional: true
        },
        slPrintDeployId: {
            id: 'custscript_ns_sl_print_deployment_id',
            optional: true
        }
    };

    const beforeLoad = (scriptContext) => {

        const ST_LOG_TITLE = 'beforeLoad';
        try {
            if (scriptContext.type == scriptContext.UserEventType.VIEW)
            {
                let objForm = scriptContext.form;
                let objParams = scriptContext.request.parameters;
                log.debug(ST_LOG_TITLE, objParams);

                if (!isEmpty(objParams.released) && objParams.released == 'T')
                {
                    objForm.addPageInitMessage({
                        type: message.Type.CONFIRMATION,
                        title: 'Success',
                        message: 'Selected items has been successfully released.',
                        duration: 5000
                    });
                }
                const PARAMS = getParameters(PARAMS_IDS);
                log.debug(ST_LOG_TITLE, 'Script Parameters: ' + JSON.stringify(PARAMS));

                let objRecord = scriptContext.newRecord;
                let intStatusId = objRecord.getValue('custrecord_status');
                let intCustomerId = objRecord.getValue('custrecord_customer') || null;
                let intIncotermId = objRecord.getValue('custrecord_fp_incoterms') || null;
                objForm.clientScriptModulePath = './ns_cs_release_lines.js';

                //Display Print Button
                objForm.addButton({
                    id: 'custpage_print_contract_button',
                    label: PARAMS.buttonPrint,
                    functionName: `printContracts(${objRecord.id}, '${PARAMS.slPrintScriptId}', '${PARAMS.slPrintDeployId}')`
                });
                log.debug(ST_LOG_TITLE, 'objRecord.id:'+objRecord.id+' | intCustomerId:'+intCustomerId+' | intIncotermId:'+intIncotermId+' | PARAMS.slScriptId:'+PARAMS.slScriptId+' | PARAMS.slDeployId:'+PARAMS.slDeployId)


                if (intStatusId == PARAMS.bsoStatusComplete) return;
                objForm.addButton({
                    id: 'custpage_release_bso_items_button',
                    label: PARAMS.buttonLabel,
                    functionName: `releaseLines(${objRecord.id}, ${intCustomerId}, ${intIncotermId}, '${PARAMS.slScriptId}', '${PARAMS.slDeployId}')`
                    // functionName: `releaseLines(${objRecord.id}, null, null, '${PARAMS.slScriptId}', '${PARAMS.slDeployId}')`
                });
            }
        } catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    const getParameters = (parameterIds) => {
        const ST_LOG_TITLE = 'getParameters';
        try {
            let scriptContext = runtime.getCurrentScript();
            let id, obj, optional, value;
            let parametersMap = {};

            log.debug(ST_LOG_TITLE, 'Parameter IDs: ' + JSON.stringify(parameterIds));

            for (let key in parameterIds) {
                if (parameterIds.hasOwnProperty(key)){
                    obj = parameterIds[key];
                    if (typeof obj === 'string') {
                        value = scriptContext.getParameter(obj);
                    } else {
                        id = obj.id;
                        optional = obj.optional;
                        value = scriptContext.getParameter(id);
                    }
                    if (value !== '' && value !== null) {
                        parametersMap[key] = value;
                    } else if (!optional) {
                        throw error.create({
                            name: 'MISSING_PARAMETER',
                            message: 'Missing Script Parameter: ' + key + '[' + id + ']'
                        });
                    }
                }
            }

            log.debug(ST_LOG_TITLE, 'Parameters: ' + JSON.stringify(parametersMap));
            return parametersMap;
        } catch (error) {
            log.error(ST_LOG_TITLE, 'name: ' + error.name + ' message: ' + error.message + ' stack: ' + error.stack);
        }
    }

    const isEmpty = (stValue) => {
        return ((stValue ==='' || stValue == null || stValue == undefined)
            || (stValue.constructor === Array && stValue.length ==0)
            || (stValue.constructor === Object && ((v) => { for (let k in v) return false; return true; })(stValue)));
    }

    return { beforeLoad }

});