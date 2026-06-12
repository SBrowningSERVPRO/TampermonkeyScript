// ==UserScript==
// @name         SERVPRO Office Auto-Fill
// @namespace    http://tampermonkey.net/
// @version      8.3
// @description  Auto-fill participant dropdowns based on selected SERVPRO office and estimator
// @author       Samuel Browning (with fixes)
// @match        https://servpro.ngsapps.net/*
// @updateURL    https://github.com/SBrowningSERVPRO/TampermonkeyScript/raw/main/script.user.js
// @downloadURL  https://github.com/SBrowningSERVPRO/TampermonkeyScript/raw/main/script.user.js
// @supportURL   https://github.com/SBrowningSERVPRO/TampermonkeyScript
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Track which fields have been manually changed by the user
    const userModifiedFields = new Set();

    // Track if we're in edit mode
    let isEditMode = false;

    // Track the edit mode mutation observer so it can be disconnected
    let editModeObserver = null;

    // Track already-processed iframes to avoid duplicate setup
    const processedIframes = new WeakSet();

    // ==================== JFC → MIT JFC TL MAPPING ====================
    const jfcToMitJfcTl = {
        '154121': { value: '216571', text: 'Fisher, Ebony' },
        '191444': { value: '66515', text: 'Burgess, Cristine' },
        '205791': { value: '216571', text: 'Fisher, Ebony' },
        '178596': { value: '216571', text: 'Fisher, Ebony' },
        '192734': { value: '216571', text: 'Fisher, Ebony' },
        '6794':   { value: '66515', text: 'Burgess, Cristine' },
        '211953': { value: '216571', text: 'Fisher, Ebony' },
        '211651': { value: '66515', text: 'Burgess, Cristine' },
        '193188': { value: '66515', text: 'Burgess, Cristine' },
        '7046':   { value: '66515', text: 'Burgess, Cristine' },
        '77219':  { value: '66515', text: 'Burgess, Cristine' },
        '173722': { value: '66515', text: 'Burgess, Cristine' },
        '143694': { value: '66515', text: 'Burgess, Cristine' },
        '173730': { value: '66515', text: 'Burgess, Cristine' },
        '172368': { value: '66515', text: 'Burgess, Cristine' },
        '192726': { value: '216571', text: 'Fisher, Ebony' },
        '214744': { value: '216571', text: 'Fisher, Ebony' },
        '177870': { value: '66515', text: 'Burgess, Cristine' },
        '168201': { value: '66515', text: 'Burgess, Cristine' },
        '193188': { value: '216571', text: 'Fisher, Ebony' },
        '7046': { value: '216571', text: 'Fisher, Ebony' },
        '77219': { value: '216571', text: 'Fisher, Ebony' },
        '172368': { value: '216571', text: 'Fisher, Ebony' },
    };
    // ====================================================================

    // Estimator database with supervisor and JFC mappings
    const estimatorDatabase = {
        // Chesterfield - Team One
        '2071':   { supervisor: { value: '21779', text: 'Team, One' }, jfc: { value: '154121', text: 'Luce, Ashlee' }, office: 'SERVPRO of Chesterfield' },
        '80083':  { supervisor: { value: '21779', text: 'Team, One' }, jfc: { value: '154121', text: 'Luce, Ashlee' }, office: 'SERVPRO of Chesterfield' },
        '11138':  { supervisor: { value: '21779', text: 'Team, One' }, jfc: { value: '191444', text: 'Echeverria, Cristal' }, office: 'SERVPRO of Chesterfield' },
        '2058':   { supervisor: { value: '21779', text: 'Team, One' }, jfc: { value: '205791', text: 'Greene, Dawn' }, office: 'SERVPRO of Chesterfield' },
        '28458':  { supervisor: { value: '21779', text: 'Team, One' }, jfc: { value: '205791', text: 'Greene, Dawn' }, office: 'SERVPRO of Chesterfield' },
        '80068':  { supervisor: { value: '21779', text: 'Team, One' }, jfc: { value: '178596', text: 'Hanchey, Katelyn' }, office: 'SERVPRO of Chesterfield' },

        // Chesterfield - Team Three
        '24446':  { supervisor: { value: '21781', text: 'Team, Three' }, jfc: { value: '178596', text: 'Hanchey, Katelyn' }, office: 'SERVPRO of Chesterfield' },
        '116116': { supervisor: { value: '21781', text: 'Team, Three' }, jfc: { value: '205791', text: 'Greene, Dawn' }, office: 'SERVPRO of Chesterfield' },
        '20779':  { supervisor: { value: '21781', text: 'Team, Three' }, jfc: { value: '192734', text: 'Carden, Valerie' }, office: 'SERVPRO of Chesterfield' },
        '115061': { supervisor: { value: '21781', text: 'Team, Three' }, jfc: { value: '6794', text: 'Parker, Sarah' }, office: 'SERVPRO of Chesterfield' },
        '115064': { supervisor: { value: '21781', text: 'Team, Three' }, jfc: { value: '211953', text: 'Harrell, Madelyn' }, office: 'SERVPRO of Chesterfield' },
        '145240': { supervisor: { value: '21781', text: 'Team, Three' }, jfc: { value: '211953', text: 'Harrell, Madelyn' }, office: 'SERVPRO of Chesterfield' },

        // Chesterfield - Contents Team
        '195592':  { supervisor: { value: '192286', text: 'Team, Contents - Chesterfield' }, jfc: { value: '211651', text: 'Browning, Samuel' }, office: 'SERVPRO of Chesterfield' },
        '192791': { supervisor: { value: '192286', text: 'Team, Contents - Chesterfield' }, jfc: { value: '211651', text: 'Browning, Samuel' }, office: 'SERVPRO of Chesterfield' },
        '216180': { supervisor: { value: '192286', text: 'Team, Contents - Chesterfield' }, jfc: { value: '211651', text: 'Browning, Samuel' }, office: 'SERVPRO of Chesterfield' },

        // Chesterfield - Direct Sales
        '2099':   { supervisor: { value: '10803', text: 'Direct, Sales' }, jfc: { value: '6794', text: 'Parker, Sarah' }, office: 'SERVPRO of Chesterfield' },

        // Chesterfield - Recon Team
        '146617': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '193188', text: 'Ange, Diane' }, office: 'SERVPRO of Chesterfield' },
        '77099':  { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '193188', text: 'Ange, Diane' }, office: 'SERVPRO of Chesterfield' },
        '154915': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '193188', text: 'Ange, Diane' }, office: 'SERVPRO of Chesterfield' },
        '213905': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '193188', text: 'Ange, Diane' }, office: 'SERVPRO of Chesterfield' },
        '162998': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '7046', text: 'Stroud, Kathryn' }, office: 'SERVPRO of Chesterfield' },
        '212138': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '7046', text: 'Stroud, Kathryn' }, office: 'SERVPRO of Chesterfield' },
        '158443': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '77219', text: 'Hubbell, Stacey' }, office: 'SERVPRO of Chesterfield' },
        '171582': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '77219', text: 'Hubbell, Stacey' }, office: 'SERVPRO of Chesterfield' },
        '173424': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '77219', text: 'Hubbell, Stacey' }, office: 'SERVPRO of Chesterfield' },
        '116527': { supervisor: { value: '21782', text: 'Team, Rec Chesterfield' }, jfc: { value: '77219', text: 'Hubbell, Stacey' }, office: 'SERVPRO of Chesterfield' },

        // Chesapeake - Team One
        '146894': { supervisor: { value: '151611', text: 'Chesapeake, Team One' }, jfc: { value: '173722', text: 'Jackson, Courtney' }, office: 'SERVPRO of Chesapeake' },
        '101500': { supervisor: { value: '151611', text: 'Chesapeake, Team One' }, jfc: { value: '143694', text: 'Mason, Monica' }, office: 'SERVPRO of Chesapeake' },
        '146895': { supervisor: { value: '151611', text: 'Chesapeake, Team One' }, jfc: { value: '173730', text: 'Moore, Tracy' }, office: 'SERVPRO of Chesapeake' },
        '205298': { supervisor: { value: '151611', text: 'Chesapeake, Team One' }, jfc: { value: '173730', text: 'Moore, Tracy' }, office: 'SERVPRO of Chesapeake' },
        '211271': { supervisor: { value: '151611', text: 'Chesapeake, Team One' }, jfc: { value: '173730', text: 'Moore, Tracy' }, office: 'SERVPRO of Chesapeake' },

        // Chesapeake - Team Two
        '3762':   { supervisor: { value: '173947', text: 'Chesapeake, Team Two' }, jfc: { value: '192734', text: 'Carden, Valerie' }, office: 'SERVPRO of Chesapeake' },
        '173718': { supervisor: { value: '173947', text: 'Chesapeake, Team Two' }, jfc: { value: '143694', text: 'Mason, Monica' }, office: 'SERVPRO of Chesapeake' },
        '90653':  { supervisor: { value: '173947', text: 'Chesapeake, Team Two' }, jfc: { value: '173722', text: 'Jackson, Courtney' }, office: 'SERVPRO of Chesapeake' },
        '95381':  { supervisor: { value: '173947', text: 'Chesapeake, Team Two' }, jfc: { value: '173730', text: 'Moore, Tracy' }, office: 'SERVPRO of Chesapeake' },
        '144699': { supervisor: { value: '173947', text: 'Chesapeake, Team Two' }, jfc: { value: '173730', text: 'Moore, Tracy' }, office: 'SERVPRO of Chesapeake' },

        // Chesapeake - Contents
        '161878': { supervisor: { value: '86750', text: 'Team, Chesapeake - Contents' }, jfc: { value: '191444', text: 'Echeverria, Cristal' }, office: 'SERVPRO of Chesapeake' },
        '141154': { supervisor: { value: '86750', text: 'Team, Chesapeake - Contents' }, jfc: { value: '191444', text: 'Echeverria, Cristal' }, office: 'SERVPRO of Chesapeake' },

        // Chesapeake - Recon Team
        '112796': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '119803': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '145494': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '158327': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '146667': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '146668': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '152487': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '143693': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '201275': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },
        '207480': { supervisor: { value: '89266', text: 'Team, Rec Chesapeake' }, jfc: { value: '172368', text: 'Sherman, Crystal' }, office: 'SERVPRO of Chesapeake' },

        // Arlington - Team Arlington
        '177893': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '192726', text: 'Oden-McIntyre, Lolita' }, office: 'SERVPRO of Arlington', backOffice: { value: '179363', text: 'Team, Water' } },
        '177894': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '154121', text: 'Luce, Ashlee' }, office: 'SERVPRO of Arlington', backOffice: { value: '179363', text: 'Team, Water' } },
        '193238': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '192726', text: 'Oden-McIntyre, Lolita' }, office: 'SERVPRO of Arlington', backOffice: { value: '179363', text: 'Team, Water' } },
        '214587': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '177870', text: 'Riaz, Saud' }, office: 'SERVPRO of Arlington', backOffice: { value: '179362', text: 'Team, Contents - Arlington' } },
        '217215': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '214744', text: 'Winfree, Tyonna' }, office: 'SERVPRO of Arlington', backOffice: { value: '179362', text: 'Team, Contents - Arlington' } },

        // Arlington - Recon Team
        '190914': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '193188', text: 'Ange, Diane' }, office: 'SERVPRO of Arlington', backOffice: { value: '179364', text: 'Team, Recon Arlington' } },
        '204894': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '193188', text: 'Ange, Diane' }, office: 'SERVPRO of Arlington', backOffice: { value: '179364', text: 'Team, Recon Arlington' } },
        '177896': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '7046', text: 'Stroud, Kathryn' }, office: 'SERVPRO of Arlington', backOffice: { value: '179364', text: 'Team, Recon Arlington' } },
        '177898': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '7046', text: 'Stroud, Kathryn' }, office: 'SERVPRO of Arlington', backOffice: { value: '179364', text: 'Team, Recon Arlington' } },
        '191446': { supervisor: { value: '177988', text: 'Arlington, Team' }, jfc: { value: '77219', text: 'Hubbell, Stacey' }, office: 'SERVPRO of Arlington', backOffice: { value: '179364', text: 'Team, Recon Arlington' } },
    };

    const officeConfigs = {
        'SERVPRO of Chesterfield': {
            'Foreperson':       { value: '3347', text: 'Not, Applicable' },
            'Accounting':       { value: '95680', text: 'Davis, Margaret' },
            'Marketing':        { value: '3347', text: 'Not, Applicable' },
            'Recon PM':         { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '203307', text: 'Eddy, Connie' },
            'Back Office Team': { value: '179363', text: 'Team, Water' },
            'Recon Follow Up':  { value: '193188', text: 'Ange, Diane' },
            'ASM':              { value: '169925', text: 'Campos, Jill' },
            'FNOL':             { value: '206376', text: 'FNOL, Chesterfield' },
            'Dispatch':         { value: '206379', text: 'Dispatch, Chesterfield' },
            'PO':               { value: '206382', text: 'PO, Chesterfield' },
            'Controller':       { value: '155385', text: 'Cleary, Thomas' },
            'SMM':              { value: '118179', text: 'Pasquinelli, Douglas' },
            'Executive':        { value: '206386', text: 'Executive, Team' },
            'Upload Updates':   { value: '206392', text: 'Upload, Updates' },
            'Warehouse Manager':{ value: '27679', text: 'Harvey, Andrew' },
            'Contents PM':      { value: '3347', text: 'Not, Applicable' },
            'Mit JFC TL':       { value: '66515', text: 'Burgess, Cristine' },
        },
        'SERVPRO of Chesapeake': {
            'Foreperson':       { value: '3347', text: 'Not, Applicable' },
            'Accounting':       { value: '140311', text: 'Shippee, Kathryn' },
            'Marketing':        { value: '3347', text: 'Not, Applicable' },
            'Recon PM':         { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '213540', text: 'Ballinger, Walt' },
            'Back Office Team': { value: '179363', text: 'Team, Water' },
            'Recon Follow Up':  { value: '172368', text: 'Sherman, Crystal' },
            'ASM':              { value: '169925', text: 'Campos, Jill' },
            'FNOL':             { value: '206377', text: 'FNOL, Chesapeake' },
            'Dispatch':         { value: '206380', text: 'DISPATCH, CHESAPEAKE' },
            'PO':               { value: '206384', text: 'PO, Chesapeake' },
            'Controller':       { value: '155385', text: 'Cleary, Thomas' },
            'SMM':              { value: '195824', text: 'Eldredge, Robb' },
            'Executive':        { value: '206386', text: 'Executive, Team' },
            'Upload Updates':   { value: '206392', text: 'Upload, Updates' },
            'Warehouse Manager':{ value: '151443', text: 'Kilgore, Clayton' },
            'Contents PM':      { value: '3347', text: 'Not, Applicable' },
            'Mit JFC TL':       { value: '66515', text: 'Burgess, Cristine' },
        },
        'SERVPRO of Arlington': {
            'Foreperson':       { value: '3347', text: 'Not, Applicable' },
            'Accounting':       { value: '177881', text: 'Matta, Sreelakshmi' },
            'Marketing':        { value: '3347', text: 'Not, Applicable' },
            'Recon PM':         { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '213542', text: 'Harrison, Lamiyah' },
            'Recon Follow Up':  { value: '193188', text: 'Ange, Diane' },
            'ASM':              { value: '169925', text: 'Campos, Jill' },
            'FNOL':             { value: '206378', text: 'FNOL, Arlington' },
            'Dispatch':         { value: '206381', text: 'Dispatch, Arlington' },
            'PO':               { value: '206385', text: 'PO, Arlington' },
            'Controller':       { value: '155385', text: 'Cleary, Thomas' },
            'SMM':              { value: '3347', text: 'Not, Applicable' },
            'Executive':        { value: '206386', text: 'Executive, Team' },
            'Back Office Team': { value: '179363', text: 'Team, Water' },
            'Warehouse Manager':{ value: '3347', text: 'Not, Applicable' },
            'Contents PM':      { value: '3347', text: 'Not, Applicable' },
            'Mit JFC TL':       { value: '66515', text: 'Burgess, Cristine' },
        },
    };

    const defaultExternalParticipants = {
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemCompanyParticipantCombobox_2':    { value: '2169730', text: 'Not Applicable' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemIndividualParticipantCombobox_4': { value: '8189271', text: 'Applicable, Not' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemCompanyParticipantCombobox_5':    { value: '685334', text: 'Not Applicable' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemIndividualParticipantCombobox_9': { value: '8303624', text: 'Applicable, Not' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemCompanyParticipantCombobox_24':   { value: '997313', text: 'not applicable' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemIndividualParticipantCombobox_33':{ value: '3450405', text: 'Applicable, Not' },
    };

    // ==================== HELPER FUNCTIONS ====================

    function getParticipantLabel(comboBoxElement) {
        const parentTable = comboBoxElement.closest('table[style="width: 100%;"]');
        if (!parentTable) return null;
        const labelSpan = parentTable.querySelector('.DashLabelFontStyle');
        return labelSpan ? labelSpan.textContent.trim() : null;
    }

    function isCompensationPlanDropdown(comboBoxElement) {
        const id = comboBoxElement.id || '';
        return id.includes('CompensationPlanComboBox');
    }

    function getCurrentDropdownValue(comboBoxElement) {
        const input = comboBoxElement.querySelector('input.rcbInput');
        const hiddenField = comboBoxElement.querySelector('input[type="hidden"][name*="_ClientState"]');
        if (!input || !hiddenField) return null;
        try {
            const clientState = JSON.parse(hiddenField.value);
            return { value: clientState.value, text: clientState.text || input.value };
        } catch (e) {
            return { value: '', text: input.value };
        }
    }

    function isDropdownReady(comboBoxElement) {
        const input = comboBoxElement.querySelector('input.rcbInput');
        const hiddenField = comboBoxElement.querySelector('input[type="hidden"][name*="_ClientState"]');
        if (!input || !hiddenField) return false;
        if (input.disabled || input.readOnly) return false;
        return comboBoxElement.offsetParent !== null;
    }

    function setDropdownValue(comboBoxElement, value, text, forceUpdate = false, retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = 300;

        const input = comboBoxElement.querySelector('input.rcbInput');
        const hiddenField = comboBoxElement.querySelector('input[type="hidden"][name*="_ClientState"]');

        if (!input || !hiddenField) {
            if (retryCount < maxRetries) {
                setTimeout(() => setDropdownValue(comboBoxElement, value, text, forceUpdate, retryCount + 1), retryDelay);
                return false;
            }
            return false;
        }

        if (!isDropdownReady(comboBoxElement) && retryCount < maxRetries) {
            setTimeout(() => setDropdownValue(comboBoxElement, value, text, forceUpdate, retryCount + 1), retryDelay);
            return false;
        }

        const fieldId = input.id || input.name;
        if (!forceUpdate && userModifiedFields.has(fieldId)) {
            return true;
        }

        input.value = text;
        if (value === '' || text === 'Select') {
            hiddenField.value = JSON.stringify({ logEntries: [], value: '', text: '', enabled: true, checkedIndices: [], checkedItemsTextOverflows: false });
            input.classList.add('rcbEmptyMessage');
        } else {
            hiddenField.value = JSON.stringify({ logEntries: [], value, text, enabled: true, checkedIndices: [], checkedItemsTextOverflows: false });
            input.classList.remove('rcbEmptyMessage');
        }

        input.dispatchEvent(new Event('change', { bubbles: true }));
        hiddenField.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✓ Set ${fieldId} → ${text}`);
        return true;
    }

    function waitForDropdownsReady(context, callback, timeout = 5000) {
        const startTime = Date.now();
        function checkReady() {
            const dropdowns = context.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox, div[id*="Estimator"].RadComboBox');
            if (dropdowns.length === 0) {
                if (Date.now() - startTime < timeout) { setTimeout(checkReady, 200); return; }
                callback(); return;
            }
            let readyCount = 0;
            dropdowns.forEach(d => { if (!isCompensationPlanDropdown(d) && isDropdownReady(d)) readyCount++; });
            if (readyCount > 0 || Date.now() - startTime >= timeout) { callback(); }
            else { setTimeout(checkReady, 200); }
        }
        checkReady();
    }

    // ==================== APPLY ESTIMATOR CONFIG ====================

    function applyEstimatorConfig(estimatorValue, context = document) {
        const estimatorData = estimatorDatabase[estimatorValue];
        if (!estimatorData) return;

        waitForDropdownsReady(context, () => {
            const participantDropdowns = context.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox, div[id*="Estimator"].RadComboBox');
            const officeConfig = officeConfigs[estimatorData.office];

            // Stage 1: Supervisor
            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;
                const label = getParticipantLabel(dropdown);
                if (label === 'Supervisor' && estimatorData.supervisor) {
                    setDropdownValue(dropdown, estimatorData.supervisor.value, estimatorData.supervisor.text, true);
                }
            });

            // Stage 2: Coordinator
            setTimeout(() => {
                participantDropdowns.forEach(dropdown => {
                    if (isCompensationPlanDropdown(dropdown)) return;
                    const label = getParticipantLabel(dropdown);
                    if (label === 'Coordinator' && estimatorData.jfc) {
                        setDropdownValue(dropdown, estimatorData.jfc.value, estimatorData.jfc.text, true);
                    }
                });
            }, 150);

            // Stage 3: Back Office Team
            setTimeout(() => {
                participantDropdowns.forEach(dropdown => {
                    if (isCompensationPlanDropdown(dropdown)) return;
                    const label = getParticipantLabel(dropdown);
                    if (label === 'Back Office Team') {
                        const bo = estimatorData.backOffice || { value: '3347', text: 'Not, Applicable' };
                        setDropdownValue(dropdown, bo.value, bo.text, true);
                    }
                });
            }, 300);

            // Stage 4: Mit JFC TL
            setTimeout(() => {
                participantDropdowns.forEach(dropdown => {
                    if (isCompensationPlanDropdown(dropdown)) return;
                    const label = getParticipantLabel(dropdown);
                    if (label === 'Mit JFC TL') {
                        const mitConfig = estimatorData.jfc && jfcToMitJfcTl[estimatorData.jfc.value];
                        if (mitConfig) {
                            setDropdownValue(dropdown, mitConfig.value, mitConfig.text, true);
                        } else if (officeConfig && officeConfig['Mit JFC TL']) {
                            const s = officeConfig['Mit JFC TL'];
                            setDropdownValue(dropdown, s.value, s.text, true);
                        }
                    }
                });
            }, 450);

            // Stage 5: Remaining office fields (edit mode only)
            if (isEditMode && officeConfig) {
                setTimeout(() => {
                    participantDropdowns.forEach(dropdown => {
                        if (isCompensationPlanDropdown(dropdown)) return;
                        const label = getParticipantLabel(dropdown);
                        if (!label || ['Estimator', 'Supervisor', 'Coordinator', 'Back Office Team', 'Mit JFC TL'].includes(label)) return;
                        if (!officeConfig[label]) return;

                        if (label === 'Marketing') {
                            const cur = getCurrentDropdownValue(dropdown);
                            if (cur && cur.value && cur.value !== '' && cur.value !== '3347' && cur.text !== 'Select') {
                                console.log(`Preserving Marketing value: ${cur.text}`);
                                return;
                            }
                        }
                        const s = officeConfig[label];
                        setDropdownValue(dropdown, s.value, s.text, true);
                    });
                }, 600);
            }
        });
    }

    // ==================== EDIT MODAL ====================

    function getEditModalIframe() {
        const modal = document.querySelector('#RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common');
        if (!modal) return null;
        const iframe = modal.querySelector('iframe[name="RadWindow_Common"]');
        if (!iframe) return null;
        try { return iframe.contentDocument || iframe.contentWindow.document; }
        catch (e) { return null; }
    }

    function setupEditModalEstimatorMonitor(iframeDoc) {
        if (processedIframes.has(iframeDoc)) return;
        processedIframes.add(iframeDoc);

        console.log('Setting up edit modal estimator monitoring...');
        isEditMode = true;
        userModifiedFields.clear();

        function waitForEditModeReady(callback, maxWait = 10000) {
            const startTime = Date.now();
            function checkReady() {
                if (Date.now() - startTime > maxWait) { callback(); return; }
                const dropdowns = iframeDoc.querySelectorAll('div[id*="Estimator"].RadComboBox, div[id*="EstimatorComboBox"].RadComboBox');
                if (dropdowns.length === 0) { setTimeout(checkReady, 200); return; }
                let estimatorReady = false;
                dropdowns.forEach(d => {
                    if (!isCompensationPlanDropdown(d) && getParticipantLabel(d) === 'Estimator' && isDropdownReady(d)) {
                        estimatorReady = true;
                    }
                });
                if (estimatorReady) { callback(); }
                else { setTimeout(checkReady, 200); }
            }
            checkReady();
        }

        waitForEditModeReady(() => {
            const participantDropdowns = iframeDoc.querySelectorAll('div[id*="Estimator"].RadComboBox, div[id*="EstimatorComboBox"].RadComboBox');
            let estimatorHiddenField = null;
            let estimatorInput = null;

            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;
                const label = getParticipantLabel(dropdown);
                if (label === 'Estimator') {
                    estimatorInput = dropdown.querySelector('input.rcbInput');
                    estimatorHiddenField = dropdown.querySelector('input[type="hidden"][name*="_ClientState"]');
                }
            });

            if (!estimatorHiddenField || !estimatorInput) { console.error('Estimator dropdown not found in edit modal'); return; }

            // Apply config for already-selected estimator
            try {
                const currentState = JSON.parse(estimatorHiddenField.value);
                if (currentState && currentState.value) {
                    setTimeout(() => applyEstimatorConfig(currentState.value, iframeDoc), 500);
                }
            } catch (e) {}

            // Monitor changes with debounce
            let changeTimeout = null;
            function handleEstimatorChange() {
                if (changeTimeout) clearTimeout(changeTimeout);
                changeTimeout = setTimeout(() => {
                    try {
                        const cs = JSON.parse(estimatorHiddenField.value);
                        if (cs && cs.value) applyEstimatorConfig(cs.value, iframeDoc);
                    } catch (e) {}
                }, 300);
            }

            const observer = new MutationObserver(mutations => {
                mutations.forEach(m => { if (m.type === 'attributes' && m.attributeName === 'value') handleEstimatorChange(); });
            });
            observer.observe(estimatorHiddenField, { attributes: true, attributeFilter: ['value'] });
            estimatorInput.addEventListener('change', handleEstimatorChange);
            editModeObserver = observer;
        });
    }

    // ==================== JOB PAGE PERSISTENT MODAL WATCHER ====================

    function isJobPage() {
        return /\/Enterprise\/Module\/Job\//i.test(window.location.pathname);
    }

    function startJobPageModalWatcher() {
        if (!isJobPage()) return;

        console.log('Job page detected — starting persistent modal watcher');

        let watchInterval = null;
        let lastSeenIframe = null;

        function checkForModal() {
            const modal = document.querySelector('#RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common');
            if (!modal) {
                if (lastSeenIframe !== null) {
                    console.log('Edit modal closed (watcher)');
                    isEditMode = false;
                    if (editModeObserver) { editModeObserver.disconnect(); editModeObserver = null; }
                    userModifiedFields.clear();
                    lastSeenIframe = null;
                }
                return;
            }

            const iframe = modal.querySelector('iframe[name="RadWindow_Common"]');
            if (!iframe) return;

            if (lastSeenIframe === iframe) return;

            let iframeDoc = null;
            try { iframeDoc = iframe.contentDocument || iframe.contentWindow.document; }
            catch (e) { return; }

            if (!iframeDoc || iframeDoc.readyState !== 'complete' || !iframeDoc.body || iframeDoc.body.children.length === 0) return;
            if (iframeDoc.querySelectorAll('.RadComboBox').length === 0) return;

            lastSeenIframe = iframe;
            console.log('Edit modal iframe ready (watcher) — initialising...');
            setTimeout(() => setupEditModalEstimatorMonitor(iframeDoc), 800);
        }

        watchInterval = setInterval(checkForModal, 400);

        const fastObserver = new MutationObserver(() => checkForModal());
        fastObserver.observe(document.body, { childList: true, subtree: false });
    }

    // ==================== CREATE JOB PAGE ====================

    function setupEstimatorMonitor() {
        waitForDropdownsReady(document, () => {
            const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox');
            let estimatorDropdown = null;

            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;
                const label = getParticipantLabel(dropdown);
                if (label === 'Estimator') estimatorDropdown = dropdown;
            });

            if (!estimatorDropdown) return;

            const estimatorInput = estimatorDropdown.querySelector('input.rcbInput');
            const estimatorHiddenField = estimatorDropdown.querySelector('input[type="hidden"][name*="_ClientState"]');
            if (!estimatorInput || !estimatorHiddenField) return;

            const observer = new MutationObserver(mutations => {
                mutations.forEach(m => {
                    if (m.type === 'attributes' && m.attributeName === 'value') {
                        try {
                            const cs = JSON.parse(estimatorHiddenField.value);
                            if (cs && cs.value) setTimeout(() => applyEstimatorConfig(cs.value), 200);
                        } catch (e) {}
                    }
                });
            });
            observer.observe(estimatorHiddenField, { attributes: true, attributeFilter: ['value'] });

            estimatorInput.addEventListener('change', () => {
                setTimeout(() => {
                    try {
                        const cs = JSON.parse(estimatorHiddenField.value);
                        if (cs && cs.value) applyEstimatorConfig(cs.value);
                    } catch (e) {}
                }, 200);
            });
        });
    }

    function setExternalParticipantDefaults() {
        Object.keys(defaultExternalParticipants).forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) return;
            const dropdown = element.closest('.RadComboBox');
            if (!dropdown) return;
            const setting = defaultExternalParticipants[elementId];
            setDropdownValue(dropdown, setting.value, setting.text);
        });
    }

    function setupUserChangeTracking() {
        const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox input.rcbInput');
        participantDropdowns.forEach(input => {
            const dropdown = input.closest('.RadComboBox');
            if (dropdown && isCompensationPlanDropdown(dropdown)) return;
            input.addEventListener('change', e => {
                userModifiedFields.add(e.target.id || e.target.name);
            });
            const arrow = input.closest('.RadComboBox').querySelector('.rcbArrowCell a');
            if (arrow) {
                arrow.addEventListener('click', () => {
                    setTimeout(() => userModifiedFields.add(input.id || input.name), 500);
                });
            }
        });
    }

    function applyOfficeConfig(officeName) {
        const config = officeConfigs[officeName];
        if (!config) return;

        waitForDropdownsReady(document, () => {
            const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox');
            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;
                const label = getParticipantLabel(dropdown);
                if (!label || ['Estimator', 'Supervisor', 'Coordinator'].includes(label)) return;
                if (!config[label]) return;

                if (label === 'Marketing') {
                    const cur = getCurrentDropdownValue(dropdown);
                    if (cur && cur.value && cur.value !== '' && cur.value !== '3347' && cur.text !== 'Select') return;
                }
                const s = config[label];
                setDropdownValue(dropdown, s.value, s.text, true);
            });
            setTimeout(() => setExternalParticipantDefaults(), 200);
        });
    }

    function setupOfficeMonitor() {
        const officeDropdown = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_Input');
        const officeHiddenField = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_ClientState');
        if (!officeDropdown || !officeHiddenField) return;

        const observer = new MutationObserver(() => {
            const newOffice = officeDropdown.value;
            if (newOffice && officeConfigs[newOffice]) setTimeout(() => applyOfficeConfig(newOffice), 300);
        });
        observer.observe(officeDropdown, { attributes: true, attributeFilter: ['value'] });
        observer.observe(officeHiddenField, { attributes: true, attributeFilter: ['value'] });

        officeDropdown.addEventListener('change', () => {
            const officeName = officeDropdown.value;
            if (officeName && officeConfigs[officeName]) setTimeout(() => applyOfficeConfig(officeName), 300);
        });
    }

    function isCreateJobPage() {
        return window.location.pathname.includes('CreateJob.aspx');
    }

    // ==================== INIT ====================

    function initialize() {
        console.log('SERVPRO Auto-Fill v8.1 initialized');

        startJobPageModalWatcher();

        if (isCreateJobPage()) {
            setupOfficeMonitor();
            setTimeout(() => setupUserChangeTracking(), 1000);
            setTimeout(() => setupEstimatorMonitor(), 1500);
            setTimeout(() => setExternalParticipantDefaults(), 800);

            const currentOffice = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_Input');
            if (currentOffice && currentOffice.value && officeConfigs[currentOffice.value]) {
                setTimeout(() => applyOfficeConfig(currentOffice.value), 1200);
            } else {
                setTimeout(() => applyOfficeConfig('SERVPRO of Chesterfield'), 1200);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
