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
 * 1.0              13 Mar 2023   mteodorojr           Add function to print contracts
 *
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url'], (url) => {

    const pageInit = (scriptContext) => {

    }

    const releaseLines = (intBsoId, intCustomerId, intIncotermId, stSlScriptId, stSlDeployId) => {
        const ST_LOG_TITLE = 'releaseLines';
        try {
            console.log('fds')
            let stSuiteletUrl = url.resolveScript({
                scriptId: stSlScriptId,
                deploymentId: stSlDeployId,
                params: {
                    bsoId: intBsoId,
                    customerId: intCustomerId,
                    incotermId: intIncotermId
                }
            });
            console.log(ST_LOG_TITLE, 'Suitelet URL: ' + stSuiteletUrl);

            let flLeftPos = (window.screen.width / 2) - ((800 / 2) + 10);
            let flTopPos = (window.screen.height / 2) - ((550 / 2) + 50);
            let stWindowFeatures = `height=550, left=${flLeftPos}, screenX=${flLeftPos}, screenY=${flTopPos}, top=${flTopPos}, width=800, `
                + `directories=no, location=no, menubar=no, resizable=yes, scrollbars=no, status=no, toolbar=no`;

            window.open(stSuiteletUrl, 'Release Items', stWindowFeatures);
        } catch (error) {
            console.error(ST_LOG_TITLE, {error});
        }
    }


    const printContracts = (intBsoId, stSlScriptId, stSlDeployId) =>
    {
        const ST_LOG_TITLE = 'printContracts';
        try {
            log.debug('in report');
            //var objRecord = JSON.parse(intBsoId);
            console.log('intBsoId:'+intBsoId);
            console.log('stSlScriptId:'+stSlScriptId);
            console.log('stSlDeployId:'+stSlDeployId);
            var output = url.resolveScript({
                scriptId: stSlScriptId,
                deploymentId: stSlDeployId,
                params: {
                    bsoId: intBsoId
                }
            });
            console.log('output:'+output);
            window.open(output);
        } catch (error) {
            log.error(ST_LOG_TITLE, {error});
        }
    }

    return { pageInit, releaseLines, printContracts }

});