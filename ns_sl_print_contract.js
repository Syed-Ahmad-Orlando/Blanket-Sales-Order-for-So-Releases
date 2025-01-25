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
 * 1.0              13 Mar 2023   mteodorojr           Initial version
 * 2.0              18 Jul 2024   Salman           Add Ship To and Bill To Address fields. Add Ship To and Bill To in the results of the customsearch_ns_fp_srch_bso and update the contract XML File
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(function (require) {
    //Load Netsuite modules
    let search = require('N/search');
    let file   = require('N/file');
    let render = require('N/render');
    let runtime= require('N/runtime');
    let format= require('N/format');
    let NSUtil = require('./NSUtilvSS2.js');

    //Declare global variables
    var ARR_SCRIPT_PARAMS = [
       { name: 'fp_bso_srch', required: true },
       { name: 'fp_tpl_contract', required: true },
       { name: 'fp_bso_item_srch', required: true }
    ];
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) =>
    {
        let stLogTitle = 'onRequest ';
        log.debug(stLogTitle, '--START--');

        try
        {
            log.debug(stLogTitle, scriptContext.request.parameters);
            let objScriptParams = getScriptParameters(ARR_SCRIPT_PARAMS);
            let objContractPdf = generateContract(scriptContext, objScriptParams);
            log.debug(stLogTitle, 'objContractPdf: ' + JSON.stringify(objContractPdf));

            scriptContext.response.setHeader({
                name: 'Content-Type',
                value: 'application/pdf'
            });

            log.audit(stLogTitle, 'Writing content...');

            scriptContext.response.write({
                output: objContractPdf.getContents()
            });
        }
        catch (err)
        {
            log.error(stLogTitle, '[Unexpected error] ' + err.toString());
            throw err;
        }
    }

    function generateContract(context,objScriptParams)
    {
        let stLogTitle = 'generateContract ';

        let request = context.request;
        let stBSOId = request.parameters.bsoId;
        log.debug(stLogTitle, 'stBSOId = ' + stBSOId);

        let arrBSOData = getBlanketSODetails(stBSOId,objScriptParams);
        let arrBSOItems = getBlanketSalesOrderItems(stBSOId,objScriptParams);

        /*<---- start rendering ---->*/
        let stTemplateID = objScriptParams.fp_tpl_contract;
        let objTemplateFile = file.load({id: stTemplateID});
        let objTemplateRenderer = render.create();

        objTemplateRenderer.templateContent = objTemplateFile.getContents();

        var objData = {
            blanketso   : arrBSOData,
            lines       : arrBSOItems
        }
        log.debug(stLogTitle, 'objData = ' + JSON.stringify(objData));

        objTemplateRenderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'cdata',
            data: objData
        });

        var stFileName = "Contract_" + stBSOId;

        var objPDFFile = objTemplateRenderer.renderAsPdf();
        objPDFFile.name = stFileName;
        return objPDFFile;
    }

    function getBlanketSalesOrderItems(stBSOId,objScriptParams)
    {
        let stLogTitle = 'getBlanketSalesOrderItems';
        let arrBlanketSalesOrderItems = [];

        let arrSearchFilter = [];
        arrSearchFilter.push(search.createFilter({ //create new filter
            name: 'custrecord_bso_id',
            operator: search.Operator.ANYOF,
            values: stBSOId
        }));
        let arrBSOItemsSrch = NSUtil.search("item", objScriptParams.fp_bso_item_srch, arrSearchFilter, null);
        log.debug(stLogTitle, 'arrBSOItemsSrch : ' + JSON.stringify(arrBSOItemsSrch));

        for (let i=0; i < arrBSOItemsSrch.length; i++)
        {
            let stItemName = (!NSUtil.isEmpty(arrBSOItemsSrch[i].getValue({name:'custrecord_item'}))) ? arrBSOItemsSrch[i].getText({name:'custrecord_item'}) : "";
            let stItemQty = arrBSOItemsSrch[i].getValue({name:'custrecord_quantity'});
            let stItemUOM = (!NSUtil.isEmpty(arrBSOItemsSrch[i].getValue({name:'custrecord_units_measure'}))) ? arrBSOItemsSrch[i].getText({name:'custrecord_units_measure'}) : "";
            let stItemPrice = (!NSUtil.isEmpty(arrBSOItemsSrch[i].getValue({name:'custrecord_price'})))?
                NSUtil.formatCurrency(arrBSOItemsSrch[i].getValue({name:'custrecord_price'}),"",2) : "";

            arrBlanketSalesOrderItems.push({
                item	: stItemName,
                qty		: stItemQty,
                uom		: stItemUOM,
                price	: stItemPrice,
            })
        }
        return arrBlanketSalesOrderItems;
    }

    function getBlanketSODetails(stBSOId, objScriptParams) {
        let stLogTitle = 'getBlanketSODetails';
    
        let arrBlanketSODetails = [];
        let arrSearchFilter = [
            search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: stBSOId
            })
        ];
    
        // Load and apply the saved search
        let customrecord_ns_bso_headerSearchObj = search.load({
            id: objScriptParams.fp_bso_srch
        });
    
        customrecord_ns_bso_headerSearchObj.filters.push(...arrSearchFilter);
    
        let arrBlanketSOData = [];
        customrecord_ns_bso_headerSearchObj.run().each(function (result) {
            arrBlanketSOData.push(result);
            return true; // Continue fetching records
        });
    
        if (!arrBlanketSOData || arrBlanketSOData.length === 0) {
            log.debug(stLogTitle, 'No data found for the given BSO ID.');
            return arrBlanketSODetails;
        }
    
        let stId = arrBlanketSOData[0].id;
        let dtCurrentDate = new Date();
        let dtDate = format.format({
            value: dtCurrentDate,
            type: format.Type.DATE
        });
    
        let stContractNumber = arrBlanketSOData[0].getValue({ name: 'name' });
        let stCustomer = arrBlanketSOData[0].getText({ name: 'custrecord_customer' }) || '';
        let stCurrency = arrBlanketSOData[0].getText({ name: 'currency', join: 'CUSTRECORD_CUSTOMER' }) || '';
        let stContactNumber = arrBlanketSOData[0].getValue({ name: 'phone', join: 'CUSTRECORD_CUSTOMER' });
        let stSubsidiary = arrBlanketSOData[0].getText({ name: 'custrecord_bso_subsidiary' }) || '';
        let stStatus = arrBlanketSOData[0].getText({ name: 'custrecord_status' }) || '';
        let stIncoTerms = arrBlanketSOData[0].getText({ name: 'custrecord_fp_cust_incoterm' }) || '';
        let stTerms = arrBlanketSOData[0].getText({ name: 'custrecord_fp_terms' }) || '';
        let dtDeliveryDate = arrBlanketSOData[0].getValue({ name: 'custrecord_fp_delivery' });
        let stDeliveryNotes = arrBlanketSOData[0].getValue({ name: 'custrecord_fp_delivery_notes' });
        let stAccountManager = arrBlanketSOData[0].getText({ name: 'custrecord_fp_account_manager' }) || '';
        let stMemo = arrBlanketSOData[0].getValue({ name: 'custrecord_fp_bso_memo' });
        let stCustomerPO = arrBlanketSOData[0].getValue({ name: 'custrecord_fp_customer_po' });
        let stShipToAddress = arrBlanketSOData[0].getValue({ name: 'custrecord_fp_shipto_address' });
        let stBillToAddress = arrBlanketSOData[0].getValue({ name: 'custrecord_fp_billto_address' });
        let stTotalFCL = arrBlanketSOData[0].getValue({ name: 'custrecord_bso_total_fcl' });
        let dtDelvStart = arrBlanketSOData[0].getValue({ name: 'custrecord_bso_delv_start' });
        let dtDelvEnd = arrBlanketSOData[0].getValue({ name: 'custrecord_bso_delv_end' });
        let stPckgType = arrBlanketSOData[0].getText({ name: 'custrecord_bso_pckg_type' });
        let stCustIncoTermDesc = arrBlanketSOData[0].getValue({ name: 'custrecord_bso_cust_incoterm_descript' });
        let qtyPerFCL = arrBlanketSOData[0].getValue({ name: 'custrecord_net_gln__fill_per_pak' });
        let pakeperFcl = arrBlanketSOData[0].getValue({ name: 'custrecord_paka_per_fcl' });
        let customerPayment = arrBlanketSOData[0].getValue({ name: 'custrecord_bso_pymt_basis' });
    
        arrBlanketSODetails.push({
            bsoid: stContractNumber,
            date: dtDate,
            customer: stCustomer,
            contactnumber: stContactNumber,
            customerpo: stCustomerPO,
            currency: stCurrency,
            subsidiary: stSubsidiary,
            status: stStatus,
            custincoterms: stIncoTerms,
            terms: stTerms,
            deliverydate: dtDeliveryDate,
            incoterms: stIncoTerms,
            deliverynotes: stDeliveryNotes,
            acctmanager: stAccountManager,
            memo: stMemo ? stMemo.replace(/\n/g, '<br />') : '',
            shiptoaddress: stShipToAddress ? stShipToAddress.replace(/\n/g, '<br />') : '',
            billtoaddress: stBillToAddress ? stBillToAddress.replace(/\n/g, '<br />') : '',
            totalfcl: stTotalFCL,
            delvstart: dtDelvStart,
            delvend: dtDelvEnd,
            pckgtype: stPckgType,
            custincotermdesc: stCustIncoTermDesc,
            qtyPerFCL: qtyPerFCL,
            pakeperFcl: pakeperFcl,
            customerPayment:customerPayment
        });
    
        return arrBlanketSODetails;
    }
    

    function getScriptParameters(arrScriptParams)
    {
        var ST_LOG_TITLE = "getScriptParameters";
        var ST_PARAM_PREFIX = "custscript_";

        try {
            var objScript = runtime.getCurrentScript();
            var objReturnValue = {};
            var self = this;

            arrScriptParams.forEach(function (value, index)
            {
                var stParamValue = objScript.getParameter({
                    name: ST_PARAM_PREFIX + value.name
                });

                if (value.required === true && NSUtil.isEmpty(stParamValue)) {
                    throw "Script parameter should not be empty. Please check script parameter and try again.";
                }
                objReturnValue[value.name] = stParamValue;
            });

            log.audit("Script Parameters", JSON.stringify(objReturnValue));
            return objReturnValue;
        }
        catch (e) {
            log.error(ST_LOG_TITLE, e);
            throw e.toString();
        }
    }

    return {onRequest}

    });
