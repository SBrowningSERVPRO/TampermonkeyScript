// ==UserScript==
// @name         SERVPRO Office Auto-Fill
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Auto-fill participant dropdowns based on selected SERVPRO office and estimator (with improved detection)
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

    // Estimator database with supervisor and JFC mappings
    const estimatorDatabase = {
        // Chesterfield - Team One
        '2071': { // Crenshaw, Justin
            supervisor: { value: '21779', text: 'Team, One' },
            jfc: { value: '154121', text: 'Luce, Ashlee' },
            office: 'SERVPRO of Chesterfield'
        },
        '80083': { // McClellan, Hampton
            supervisor: { value: '21779', text: 'Team, One' },
            jfc: { value: '154121', text: 'Luce, Ashlee' },
            office: 'SERVPRO of Chesterfield'
        },
        '11138': { // Slaasted, Evan
            supervisor: { value: '21779', text: 'Team, One' },
            jfc: { value: '191444', text: 'Echeverria, Cristal' }, // UPDATED
            office: 'SERVPRO of Chesterfield'
        },
        '2058': { // Ballas, Justin
            supervisor: { value: '21779', text: 'Team, One' },
            jfc: { value: '178596', text: 'Hanchey, Katelyn' },
            office: 'SERVPRO of Chesterfield'
        },
        '28458': { // Snyder, Matthew
            supervisor: { value: '21779', text: 'Team, One' },
            jfc: { value: '205791', text: 'Greene, Dawn' },
            office: 'SERVPRO of Chesterfield'
        },
        '80068': { // Bahen, Nathan
            supervisor: { value: '21779', text: 'Team, One' },
            jfc: { value: '45120', text: 'Rogers, Melanie' },
            office: 'SERVPRO of Chesterfield'
        },

        // Chesterfield - Team Three
        '24446': { // Fuentes-Bonilla, Nancy
            supervisor: { value: '21781', text: 'Team, Three' },
            jfc: { value: '178596', text: 'Hanchey, Katelyn' },
            office: 'SERVPRO of Chesterfield'
        },
        '116116': { // Kurz, Aaron
            supervisor: { value: '21781', text: 'Team, Three' },
            jfc: { value: '205791', text: 'Greene, Dawn' },
            office: 'SERVPRO of Chesterfield'
        },
        '20779': { // Fleming, Chris
            supervisor: { value: '21781', text: 'Team, Three' },
            jfc: { value: '45120', text: 'Rogers, Melanie' },
            office: 'SERVPRO of Chesterfield'
        },
        '115061': { // Padilla, Paola
            supervisor: { value: '21781', text: 'Team, Three' },
            jfc: { value: '6794', text: 'Parker, Sarah' },
            office: 'SERVPRO of Chesterfield'
        },
        '115064': { // Leon Carrasco, Andres
            supervisor: { value: '21781', text: 'Team, Three' },
            jfc: { value: '211953', text: 'Harrell, Madelyn' },
            office: 'SERVPRO of Chesterfield'
        },

        // Chesterfield - Contents Team
        '17879': { // Genest, Brian
            supervisor: { value: '192286', text: 'Team, Contents - Chesterfield' },
            jfc: { value: '211651', text: 'Browning, Samuel' }, // UPDATED
            office: 'SERVPRO of Chesterfield'
        },
        '192791': { // Solomon, Lenzy
            supervisor: { value: '192286', text: 'Team, Contents - Chesterfield' },
            jfc: { value: '211651', text: 'Browning, Samuel' },
            office: 'SERVPRO of Chesterfield'
        },
        '195592': { // Romano, John
            supervisor: { value: '192286', text: 'Team, Contents - Chesterfield' },
            jfc: { value: '211651', text: 'Browning, Samuel' }, // UPDATED
            office: 'SERVPRO of Chesterfield'
        },

        // Chesterfield - Direct Sales
        '2099': { // Morgan, Robert (Bobby)
            supervisor: { value: '10803', text: 'Direct, Sales' },
            jfc: { value: '6794', text: 'Parker, Sarah' }, // UPDATED
            office: 'SERVPRO of Chesterfield'
        },

        // Chesterfield - Recon Team
        '146617': { // Aubertin, Donovan
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '193188', text: 'Ange, Diane' },
            office: 'SERVPRO of Chesterfield'
        },
        '77099': { // Riddle, Tracy
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '193188', text: 'Ange, Diane' },
            office: 'SERVPRO of Chesterfield'
        },
        '154915': { // Riddle, Bryan
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '193188', text: 'Ange, Diane' },
            office: 'SERVPRO of Chesterfield'
        },
        '213905': { // Russell, Mark
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '193188', text: 'Ange, Diane' },
            office: 'SERVPRO of Chesterfield'
        },
        '162998': { // Profatylo, Pavlo
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '7046', text: 'Stroud, Kathryn' },
            office: 'SERVPRO of Chesterfield'
        },
        '212138': { // Kaisand, Derek
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '7046', text: 'Stroud, Kathryn' },
            office: 'SERVPRO of Chesterfield'
        },
        '158443': { // Pernell, Jeffrey
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '77219', text: 'Hubbell, Stacey' },
            office: 'SERVPRO of Chesterfield'
        },
        '171582': { // Martin, Michael
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '77219', text: 'Hubbell, Stacey' },
            office: 'SERVPRO of Chesterfield'
        },
        '173424': { // Jackson, Malachi
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '77219', text: 'Hubbell, Stacey' },
            office: 'SERVPRO of Chesterfield'
        },
        '116527': { // Estep, Wayne
            supervisor: { value: '21782', text: 'Team, Rec Chesterfield' },
            jfc: { value: '77219', text: 'Hubbell, Stacey' },
            office: 'SERVPRO of Chesterfield'
        },

        // Chesapeake - Team One
        '146894': { // Clapp, Steven
            supervisor: { value: '151611', text: 'Chesapeake, Team One' },
            jfc: { value: '173722', text: 'Jackson, Courtney' },
            office: 'SERVPRO of Chesapeake'
        },
        '101500': { // Williams, Dequan
            supervisor: { value: '151611', text: 'Chesapeake, Team One' },
            jfc: { value: '143694', text: 'Mason, Monica' },
            office: 'SERVPRO of Chesapeake'
        },
        '146895': { // Perry, Demetrius
            supervisor: { value: '151611', text: 'Chesapeake, Team One' },
            jfc: { value: '173730', text: 'Moore, Tracy' },
            office: 'SERVPRO of Chesapeake'
        },
        '205298': { // Nichols, Charles
            supervisor: { value: '151611', text: 'Chesapeake, Team One' },
            jfc: { value: '173730', text: 'Moore, Tracy' },
            office: 'SERVPRO of Chesapeake'
        },

        // Chesapeake - Team Two
        '3762': { // Proffitt, Matthew
            supervisor: { value: '173947', text: 'Chesapeake, Team Two' },
            jfc: { value: '192734', text: 'Carden, Valerie' },
            office: 'SERVPRO of Chesapeake'
        },
        '173718': { // Luther, Susanne
            supervisor: { value: '173947', text: 'Chesapeake, Team Two' },
            jfc: { value: '143694', text: 'Mason, Monica' },
            office: 'SERVPRO of Chesapeake'
        },
        '90653': { // Reid, Darryl
            supervisor: { value: '173947', text: 'Chesapeake, Team Two' },
            jfc: { value: '173722', text: 'Jackson, Courtney' },
            office: 'SERVPRO of Chesapeake'
        },
        '95381': { // Smith, James
            supervisor: { value: '173947', text: 'Chesapeake, Team Two' },
            jfc: { value: '173730', text: 'Moore, Tracy' },
            office: 'SERVPRO of Chesapeake'
        },
        '144699': { // OQuinn, Mikkarice
            supervisor: { value: '173947', text: 'Chesapeake, Team Two' },
            jfc: { value: '192734', text: 'Carden, Valerie' },
            office: 'SERVPRO of Chesapeake'
        },

        // Chesapeake - Contents
        '161878': { // Kimbrough, Brandi
            supervisor: { value: '86750', text: 'Team, Chesapeake - Contents' },
            jfc: { value: '191444', text: 'Echeverria, Cristal' }, // UPDATED
            office: 'SERVPRO of Chesapeake'
        },

        // Chesapeake - Recon Team
        '112796': { // Virgili, Raymond
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '119803': { // Wood, Stephanie
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '145494': { // Grizzle, Lorraine
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '158327': { // Mitchell, Kelly
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '146667': { // Lane, Michael
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '146668': { // Perry, Noah
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '152487': { // Grier, Christopher
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '143693': { // Wilkes, Brittney
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '201275': { // Brinn, Timothy
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },
        '207480': { // Ketcherside, Max
            supervisor: { value: '89266', text: 'Team, Rec Chesapeake' },
            jfc: { value: '172368', text: 'Sherman, Crystal' },
            office: 'SERVPRO of Chesapeake'
        },

        // Arlington - Team Arlington
        '177893': { // Fernandez, Alexis
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '168201', text: 'Clanton, Trameca' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179363', text: 'Team, Water' }
        },
        '177894': { // Khalaf, Qusay
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '168201', text: 'Clanton, Trameca' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179363', text: 'Team, Water' }
        },
        '193238': { // Lucas, Teddy
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '192726', text: 'Oden-McIntyre, Lolita' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179363', text: 'Team, Water' }
        },
        '214587': { // Hill, Anijza
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '177870', text: 'Riaz, Saud' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179362', text: 'Team, Contents - Arlington' }
        },
        '177900': { // Thompson, Terry - Special case
            supervisor: { value: '177988', text: 'Arlington, Team' },
            office: 'SERVPRO of Arlington',
            special: 'terry_thompson'
        },

        // Arlington - Recon Team
        '190914': { // Albrich, Al
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '193188', text: 'Ange, Diane' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179364', text: 'Team, Recon Arlington' }
        },
        '204894': { // Guy, Daniel
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '193188', text: 'Ange, Diane' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179364', text: 'Team, Recon Arlington' }
        },
        '177896': { // Reed, Andrew
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '7046', text: 'Stroud, Kathryn' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179364', text: 'Team, Recon Arlington' }
        },
        '177898': { // Sines, Jason
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '7046', text: 'Stroud, Kathryn' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179364', text: 'Team, Recon Arlington' }
        },
        '191446': { // Honaker, David
            supervisor: { value: '177988', text: 'Arlington, Team' },
            jfc: { value: '77219', text: 'Hubbell, Stacey' },
            office: 'SERVPRO of Arlington',
            backOffice: { value: '179364', text: 'Team, Recon Arlington' }
        }
    };

    // MISSING CONFIGURATION FOR TERRY THOMPSON ADDED HERE
    const terryThompsonConfigs = {
        'water': {
            jfc: { value: '168201', text: 'Clanton, Trameca' },
            backOffice: { value: '179363', text: 'Team, Water' }
        },
        'contents': {
            jfc: { value: '177870', text: 'Riaz, Saud' },
            backOffice: { value: '179362', text: 'Team, Contents - Arlington' }
        },
        'recon': {
            jfc: { value: '193188', text: 'Ange, Diane' },
            backOffice: { value: '179364', text: 'Team, Recon Arlington' }
        }
    };

    // Base office configurations (for fields not handled by estimator selection)
    const officeConfigs = {
        'SERVPRO of Chesterfield': {
            'Foreperson': { value: '3347', text: 'Not, Applicable' },
            'Accounting': { value: '95680', text: 'Davis, Margaret' },
            'Marketing': { value: '3347', text: 'Not, Applicable' },
            'Recon PM': { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '203307', text: 'Eddy, Connie' },
            'Back Office Team': { value: '3347', text: 'Not, Applicable' },
            'Recon Follow Up': { value: '193188', text: 'Ange, Diane' },
            'ASM': { value: '169925', text: 'Campos, Jill' },
            'FNOL': { value: '206376', text: 'FNOL, Chesterfield' },
            'Dispatch': { value: '206379', text: 'Dispatch, Chesterfield' },
            'PO': { value: '206382', text: 'PO, Chesterfield' },
            'Controller': { value: '155385', text: 'Cleary, Thomas' },
            'SMM': { value: '118179', text: 'Pasquinelli, Douglas' },
            'Executive': { value: '206386', text: 'Executive, Team' },
            'Upload Updates': { value: '206392', text: 'Upload, Updates' },
            'Warehouse Manager': { value: '27679', text: 'Harvey, Andrew' },
            'Contents PM': { value: '3347', text: 'Not, Applicable' },
            'Mit JFC TL': { value: '66515', text: 'Burgess, Cristine' }
        },
        'SERVPRO of Chesapeake': {
            'Foreperson': { value: '3347', text: 'Not, Applicable' },
            'Accounting': { value: '140311', text: 'Shippee, Kathryn' },
            'Marketing': { value: '3347', text: 'Not, Applicable' },
            'Recon PM': { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '213540', text: 'Ballinger, Walt' },
            'Back Office Team': { value: '3347', text: 'Not, Applicable' },
            'Recon Follow Up': { value: '172368', text: 'Sherman, Crystal' },
            'ASM': { value: '169925', text: 'Campos, Jill' },
            'FNOL': { value: '206377', text: 'FNOL, Chesapeake' },
            'Dispatch': { value: '206380', text: 'DISPATCH, CHESAPEAKE' },
            'PO': { value: '206384', text: 'PO, Chesapeake' },
            'Controller': { value: '155385', text: 'Cleary, Thomas' },
            'SMM': { value: '195824', text: 'Eldredge, Robb' },
            'Executive': { value: '206386', text: 'Executive, Team' },
            'Upload Updates': { value: '206392', text: 'Upload, Updates' },
            'Warehouse Manager': { value: '151443', text: 'Kilgore, Clayton' },
            'Contents PM': { value: '3347', text: 'Not, Applicable' },
            'Mit JFC TL': { value: '66515', text: 'Burgess, Cristine' }
        },
        'SERVPRO of Arlington': {
            'Foreperson': { value: '3347', text: 'Not, Applicable' },
            'Accounting': { value: '177881', text: 'Matta, Sreelakshmi' },
            'Marketing': { value: '3347', text: 'Not, Applicable' },
            'Recon PM': { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '213542', text: 'Harrison, Lamiyah' },
            'Recon Follow Up': { value: '193188', text: 'Ange, Diane' },
            'ASM': { value: '169925', text: 'Campos, Jill' },
            'FNOL': { value: '206378', text: 'FNOL, Arlington' },
            'Dispatch': { value: '206381', text: 'Dispatch, Arlington' },
            'PO': { value: '206385', text: 'PO, Arlington' },
            'Controller': { value: '155385', text: 'Cleary, Thomas' },
            'SMM': { value: '3347', text: 'Not, Applicable' },
            'Executive': { value: '206386', text: 'Executive, Team' },
            'Upload Updates': { value: '206392', text: 'Upload, Updates' },
            'Warehouse Manager': { value: '3347', text: 'Not, Applicable' },
            'Contents PM': { value: '3347', text: 'Not, Applicable' },
            'Mit JFC TL': { value: '66515', text: 'Burgess, Cristine' }
        }
    };

    // Default external participant values
    const defaultExternalParticipants = {
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemCompanyParticipantCombobox_2': { value: '2169730', text: 'Not Applicable' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemIndividualParticipantCombobox_4': { value: '8189271', text: 'Applicable, Not' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemCompanyParticipantCombobox_5': { value: '685334', text: 'Not Applicable' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemIndividualParticipantCombobox_9': { value: '8303624', text: 'Applicable, Not' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemCompanyParticipantCombobox_24': { value: '997313', text: 'not applicable' },
        'ctl00_ContentPlaceHolder1_JobParentInformation_ExternalParticipants_SystemIndividualParticipantCombobox_33': { value: '3450405', text: 'Applicable, Not' }
    };

    // Function to get participant label from the DOM element
    function getParticipantLabel(comboBoxElement) {
        const parentTable = comboBoxElement.closest('table[style="width: 100%;"]');
        if (!parentTable) return null;
        const labelSpan = parentTable.querySelector('.DashLabelFontStyle');
        return labelSpan ? labelSpan.textContent.trim() : null;
    }

    // Function to check if a dropdown is a compensation plan dropdown (should be skipped)
    function isCompensationPlanDropdown(comboBoxElement) {
        const id = comboBoxElement.id || '';
        return id.includes('CompensationPlanComboBox');
    }

    // Function to get current dropdown value
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

    // Function to check if dropdown is ready for updates
    function isDropdownReady(comboBoxElement) {
        const input = comboBoxElement.querySelector('input.rcbInput');
        const hiddenField = comboBoxElement.querySelector('input[type="hidden"][name*="_ClientState"]');
        
        if (!input || !hiddenField) return false;
        
        // Check if the dropdown is visible and enabled
        if (input.disabled || input.readOnly) return false;
        
        // Check if it has a parent that's visible
        const isVisible = comboBoxElement.offsetParent !== null;
        return isVisible;
    }

    // Function to set dropdown value with retry logic
    function setDropdownValue(comboBoxElement, value, text, forceUpdate = false, retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = 300;

        const input = comboBoxElement.querySelector('input.rcbInput');
        const hiddenField = comboBoxElement.querySelector('input[type="hidden"][name*="_ClientState"]');
        
        if (!input || !hiddenField) {
            if (retryCount < maxRetries) {
                console.log(`Dropdown elements not found, retrying... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => {
                    setDropdownValue(comboBoxElement, value, text, forceUpdate, retryCount + 1);
                }, retryDelay);
                return false;
            }
            console.error('Failed to find dropdown elements after retries');
            return false;
        }

        // Check if dropdown is ready
        if (!isDropdownReady(comboBoxElement)) {
            if (retryCount < maxRetries) {
                console.log(`Dropdown not ready, retrying... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => {
                    setDropdownValue(comboBoxElement, value, text, forceUpdate, retryCount + 1);
                }, retryDelay);
                return false;
            }
            console.warn('Dropdown not ready after retries, attempting update anyway');
        }

        const fieldId = input.id || input.name;
        if (!forceUpdate && userModifiedFields.has(fieldId)) {
            console.log(`Skipping ${fieldId} - user has modified this field`);
            return true;
        }

        input.value = text;
        if (value === '' || text === 'Select') {
            const emptyClientState = {
                logEntries: [],
                value: "",
                text: "",
                enabled: true,
                checkedIndices: [],
                checkedItemsTextOverflows: false
            };
            hiddenField.value = JSON.stringify(emptyClientState);
            if (!input.classList.contains('rcbEmptyMessage')) {
                input.classList.add('rcbEmptyMessage');
            }
        } else {
            const clientState = {
                logEntries: [],
                value: value,
                text: text,
                enabled: true,
                checkedIndices: [],
                checkedItemsTextOverflows: false
            };
            hiddenField.value = JSON.stringify(clientState);
            input.classList.remove('rcbEmptyMessage');
        }

        input.dispatchEvent(new Event('change', { bubbles: true }));
        hiddenField.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log(`✓ Successfully set ${fieldId} to: ${text}`);
        return true;
    }

    // Function to wait for dropdowns to be ready
    function waitForDropdownsReady(context, callback, timeout = 5000) {
        const startTime = Date.now();
        
        function checkReady() {
            const dropdowns = context.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox, div[id*="Estimator"].RadComboBox');
            
            if (dropdowns.length === 0) {
                if (Date.now() - startTime < timeout) {
                    setTimeout(checkReady, 200);
                    return;
                }
                console.warn('No dropdowns found after timeout');
                callback();
                return;
            }
            
            // Check if at least some dropdowns are ready
            let readyCount = 0;
            dropdowns.forEach(dropdown => {
                if (!isCompensationPlanDropdown(dropdown) && isDropdownReady(dropdown)) {
                    readyCount++;
                }
            });
            
            if (readyCount > 0 || Date.now() - startTime >= timeout) {
                console.log(`Found ${readyCount} ready dropdowns, proceeding...`);
                callback();
            } else {
                setTimeout(checkReady, 200);
            }
        }
        
        checkReady();
    }

    // Function to create Terry Thompson job type popup
    function createTerryThompsonPopup(estimatorDropdown) {
        const existingPopup = document.getElementById('terry-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.id = 'terry-popup';
        popup.style.cssText = `
            position: fixed;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            min-width: 200px;
        `;

        popup.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #333;">
                Terry Thompson - Select Job Type:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="terry-water" style="padding: 8px 12px; border: 1px solid #007cba; background: #007cba; color: white; border-radius: 4px; cursor: pointer;">Water/Other</button>
                <button id="terry-contents" style="padding: 8px 12px; border: 1px solid #007cba; background: #007cba; color: white; border-radius: 4px; cursor: pointer;">Contents</button>
                <button id="terry-recon" style="padding: 8px 12px; border: 1px solid #007cba; background: #007cba; color: white; border-radius: 4px; cursor: pointer;">Recon</button>
            </div>
        `;

        const rect = estimatorDropdown.getBoundingClientRect();
        popup.style.left = (rect.right + 10) + 'px';
        popup.style.top = rect.top + 'px';

        document.body.appendChild(popup);

        document.getElementById('terry-water').addEventListener('click', () => applyTerryThompsonConfig('water', popup));
        document.getElementById('terry-contents').addEventListener('click', () => applyTerryThompsonConfig('contents', popup));
        document.getElementById('terry-recon').addEventListener('click', () => applyTerryThompsonConfig('recon', popup));

        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);
    }

    // Function to apply Terry Thompson configuration
    function applyTerryThompsonConfig(jobType, popup) {
        const config = terryThompsonConfigs[jobType];
        if (!config) return;

        const context = isEditMode ? getEditModalIframe() : document;
        if (!context) return;

        const participantDropdowns = context.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox, div[id*="Estimator"].RadComboBox');
        
        // Set Back Office Team first
        participantDropdowns.forEach(dropdown => {
            if (isCompensationPlanDropdown(dropdown)) return;

            const label = getParticipantLabel(dropdown);
            if (label === 'Back Office Team') {
                setDropdownValue(dropdown, config.backOffice.value, config.backOffice.text, true);
            }
        });

        // Then set Coordinator with a slight delay
        setTimeout(() => {
            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;

                const label = getParticipantLabel(dropdown);
                if (label === 'Coordinator') {
                    setDropdownValue(dropdown, config.jfc.value, config.jfc.text, true);
                }
            });
        }, 100);

        popup.remove();
        console.log(`Applied Terry Thompson ${jobType} configuration`);
    }

    // Function to apply estimator-based configuration
    function applyEstimatorConfig(estimatorValue, context = document) {
        const estimatorData = estimatorDatabase[estimatorValue];
        if (!estimatorData) {
            console.log('No estimator configuration found for value:', estimatorValue);
            return;
        }

        console.log('Applying estimator configuration for:', estimatorData);

        waitForDropdownsReady(context, () => {
            const participantDropdowns = context.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox, div[id*="Estimator"].RadComboBox');

            // Handle special case for Terry Thompson
            if (estimatorData.special === 'terry_thompson') {
                participantDropdowns.forEach(dropdown => {
                    if (isCompensationPlanDropdown(dropdown)) return;

                    const label = getParticipantLabel(dropdown);
                    if (label === 'Supervisor') {
                        setDropdownValue(dropdown, estimatorData.supervisor.value, estimatorData.supervisor.text, true);
                    }
                });

                const estimatorDropdown = Array.from(participantDropdowns).find(dropdown => {
                    return !isCompensationPlanDropdown(dropdown) && getParticipantLabel(dropdown) === 'Estimator';
                });
                if (estimatorDropdown) {
                    createTerryThompsonPopup(estimatorDropdown);
                }
                return;
            }

            // Get office configuration for this estimator's office
            const officeConfig = officeConfigs[estimatorData.office];

            // Apply in stages with delays to ensure proper rendering
            // Stage 1: Supervisor
            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;
                const label = getParticipantLabel(dropdown);
                
                if (label === 'Supervisor' && estimatorData.supervisor) {
                    setDropdownValue(dropdown, estimatorData.supervisor.value, estimatorData.supervisor.text, true);
                }
            });

            // Stage 2: Coordinator (with delay)
            setTimeout(() => {
                participantDropdowns.forEach(dropdown => {
                    if (isCompensationPlanDropdown(dropdown)) return;
                    const label = getParticipantLabel(dropdown);
                    
                    if (label === 'Coordinator' && estimatorData.jfc) {
                        setDropdownValue(dropdown, estimatorData.jfc.value, estimatorData.jfc.text, true);
                    }
                });
            }, 150);

            // Stage 3: Back Office Team (with delay)
            setTimeout(() => {
                participantDropdowns.forEach(dropdown => {
                    if (isCompensationPlanDropdown(dropdown)) return;
                    const label = getParticipantLabel(dropdown);
                    
                    if (label === 'Back Office Team') {
                        if (estimatorData.backOffice) {
                            setDropdownValue(dropdown, estimatorData.backOffice.value, estimatorData.backOffice.text, true);
                        } else {
                            setDropdownValue(dropdown, '3347', 'Not, Applicable', true);
                        }
                    }
                });
            }, 300);

            // Stage 4: Office-specific fields in edit mode (with delay)
            if (isEditMode && officeConfig) {
                setTimeout(() => {
                    participantDropdowns.forEach(dropdown => {
                        if (isCompensationPlanDropdown(dropdown)) return;
                        const label = getParticipantLabel(dropdown);
                        
                        if (label && officeConfig[label] && !['Estimator', 'Supervisor', 'Coordinator', 'Back Office Team'].includes(label)) {
                            if (label === 'Marketing') {
                                const currentValue = getCurrentDropdownValue(dropdown);
                                if (currentValue && currentValue.value && currentValue.value !== '' && currentValue.value !== '3347' && currentValue.text !== 'Select') {
                                    console.log(`Preserving Marketing value: ${currentValue.text}`);
                                } else {
                                    const setting = officeConfig[label];
                                    setDropdownValue(dropdown, setting.value, setting.text, true);
                                }
                            } else {
                                const setting = officeConfig[label];
                                setDropdownValue(dropdown, setting.value, setting.text, true);
                            }
                        }
                    });
                }, 450);
            }
        });
    }

    // Function to get the Edit Modal iframe document
    function getEditModalIframe() {
        const modal = document.querySelector('#RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common');
        if (!modal) return null;

        const iframe = modal.querySelector('iframe[name="RadWindow_Common"]');
        if (!iframe) return null;

        try {
            return iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) {
            console.log('Cannot access iframe content:', e);
            return null;
        }
    }

    // Function to setup estimator monitoring in Edit Modal
    function setupEditModalEstimatorMonitor(iframeDoc) {
    console.log('Setting up edit modal estimator monitoring...');
    isEditMode = true;

    // Clear any previous user modifications for edit mode
    userModifiedFields.clear();

    // Enhanced waiting for dropdowns to be truly ready
    function waitForEditModeReady(callback, maxWait = 10000) {
        const startTime = Date.now();
        
        function checkReady() {
            if (Date.now() - startTime > maxWait) {
                console.warn('Edit mode initialization timeout, proceeding anyway');
                callback();
                return;
            }

            const dropdowns = iframeDoc.querySelectorAll('div[id*="Estimator"].RadComboBox, div[id*="EstimatorComboBox"].RadComboBox');
            if (dropdowns.length === 0) {
                setTimeout(checkReady, 200);
                return;
            }

            // Check if dropdowns have initialized content
            let readyCount = 0;
            let estimatorFound = false;
            
            dropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;
                
                const label = getParticipantLabel(dropdown);
                if (label === 'Estimator') {
                    estimatorFound = true;
                    if (isDropdownReady(dropdown)) {
                        readyCount++;
                    }
                }
            });

            if (estimatorFound && readyCount > 0) {
                console.log('Edit mode dropdowns ready, proceeding...');
                callback();
            } else {
                setTimeout(checkReady, 200);
            }
        }
        
        checkReady();
    }

    waitForEditModeReady(() => {
        const participantDropdowns = iframeDoc.querySelectorAll('div[id*="Estimator"].RadComboBox, div[id*="EstimatorComboBox"].RadComboBox');
        let estimatorDropdown = null;
        let estimatorInput = null;
        let estimatorHiddenField = null;

        // Find estimator dropdown
        participantDropdowns.forEach(dropdown => {
            if (isCompensationPlanDropdown(dropdown)) return;
            const label = getParticipantLabel(dropdown);
            if (label === 'Estimator') {
                estimatorDropdown = dropdown;
                estimatorInput = dropdown.querySelector('input.rcbInput');
                estimatorHiddenField = dropdown.querySelector('input[type="hidden"][name*="_ClientState"]');
            }
        });

        if (!estimatorDropdown || !estimatorInput || !estimatorHiddenField) {
            console.error('Estimator dropdown not found in edit modal');
            return;
        }

        // Check if there's already an estimator selected and apply config
        try {
            const currentState = JSON.parse(estimatorHiddenField.value);
            if (currentState && currentState.value) {
                console.log('Found existing estimator on modal open:', currentState.value);
                setTimeout(() => {
                    applyEstimatorConfig(currentState.value, iframeDoc);
                }, 500);
            }
        } catch (e) {
            console.log('No existing estimator found on modal open');
        }

        // Setup change monitoring with debouncing
        let changeTimeout = null;
        
        function handleEstimatorChange() {
            if (changeTimeout) {
                clearTimeout(changeTimeout);
            }
            
            changeTimeout = setTimeout(() => {
                try {
                    const clientState = JSON.parse(estimatorHiddenField.value);
                    if (clientState && clientState.value) {
                        console.log('Edit modal estimator changed:', clientState.value);
                        applyEstimatorConfig(clientState.value, iframeDoc);
                    }
                } catch (e) {
                    console.log('Could not parse estimator state');
                }
            }, 300);
        }

        // Monitor hidden field changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    handleEstimatorChange();
                }
            });
        });

        observer.observe(estimatorHiddenField, { 
            attributes: true, 
            attributeFilter: ['value'] 
        });

        // Also listen for input change events
        estimatorInput.addEventListener('change', handleEstimatorChange);
        
        // Store observer so we can disconnect it when modal closes
        editModeObserver = observer;

        console.log('Edit modal estimator monitoring setup complete');
    });
}

    // Function to monitor for Edit Job Information modal
    function setupEditModalMonitor() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.id === 'RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common') {
                    console.log('Edit Job Information modal detected');

                    const iframeName = "RadWindow_Common";
                    let attempts = 0;
                    const maxAttempts = 40; // 20 seconds
                    const retryInterval = 500;

                    function trySetupModal() {
                        const modal = document.querySelector('#RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common');
                        if (!modal) {
                            console.log('Modal disappeared, stopping setup');
                            return;
                        }

                        const iframe = modal.querySelector(`iframe[name="${iframeName}"]`);
                        if (iframe) {
                            try {
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                
                                // Check if iframe is ready with more thorough validation
                                if (iframeDoc && 
                                    iframeDoc.readyState === 'complete' && 
                                    iframeDoc.body && 
                                    iframeDoc.body.children.length > 0) {
                                    
                                    // Additional check: make sure the form content is loaded
                                    const hasDropdowns = iframeDoc.querySelectorAll('.RadComboBox').length > 0;
                                    
                                    if (hasDropdowns) {
                                        console.log('Edit modal iframe fully loaded and ready');
                                        // Extra delay to ensure all scripts and AJAX are complete
                                        setTimeout(() => {
                                            setupEditModalEstimatorMonitor(iframeDoc);
                                        }, 800);
                                        return;
                                    } else {
                                        console.log('Iframe loaded but dropdowns not yet rendered');
                                        throw new Error('Dropdowns not ready');
                                    }
                                } else {
                                    throw new Error('Iframe not ready');
                                }
                            } catch (e) {
                                attempts++;
                                if (attempts < maxAttempts) {
                                    console.log(`Iframe not ready, retrying... (${attempts}/${maxAttempts})`);
                                    setTimeout(trySetupModal, retryInterval);
                                } else {
                                    console.error(`Failed to initialize edit modal after ${maxAttempts * retryInterval}ms`);
                                }
                            }
                        } else {
                            attempts++;
                            if (attempts < maxAttempts) {
                                console.log(`Iframe not found, retrying... (${attempts}/${maxAttempts})`);
                                setTimeout(trySetupModal, retryInterval);
                            } else {
                                console.error('Failed to find edit modal iframe');
                            }
                        }
                    }
                    
                    // Start trying after a short delay
                    setTimeout(trySetupModal, 300);
                }
            });

            mutation.removedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.id === 'RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common') {
                    console.log('Edit Job Information modal closed');
                    isEditMode = false;
                    
                    // Disconnect the observer
                    if (editModeObserver) {
                        editModeObserver.disconnect();
                        editModeObserver = null;
                    }
                    
                    // Clear user modifications
                    userModifiedFields.clear();
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('Edit modal monitor active');
}
    
    // Function to setup estimator monitoring (for Create Job page)
    function setupEstimatorMonitor() {
        console.log('Setting up estimator monitoring...');
        
        waitForDropdownsReady(document, () => {
            const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox');
            let estimatorDropdown = null;

            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;

                const label = getParticipantLabel(dropdown);
                if (label === 'Estimator') {
                    estimatorDropdown = dropdown;
                }
            });

            if (!estimatorDropdown) {
                console.log('Estimator dropdown not found');
                return;
            }

            const estimatorInput = estimatorDropdown.querySelector('input.rcbInput');
            const estimatorHiddenField = estimatorDropdown.querySelector('input[type="hidden"][name*="_ClientState"]');

            if (!estimatorInput || !estimatorHiddenField) {
                console.log('Estimator input elements not found');
                return;
            }

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                        try {
                            const clientState = JSON.parse(estimatorHiddenField.value);
                            if (clientState && clientState.value) {
                                setTimeout(() => {
                                    applyEstimatorConfig(clientState.value);
                                }, 200);
                            }
                        } catch (e) {
                            console.log('Could not parse estimator client state');
                        }
                    }
                });
            });

            observer.observe(estimatorHiddenField, { attributes: true, attributeFilter: ['value'] });

            estimatorInput.addEventListener('change', () => {
                setTimeout(() => {
                    try {
                        const clientState = JSON.parse(estimatorHiddenField.value);
                        if (clientState && clientState.value) {
                            applyEstimatorConfig(clientState.value);
                        }
                    } catch (e) {
                        console.log('Could not parse estimator client state on change');
                    }
                }, 200);
            });

            console.log('Estimator monitoring setup complete');
        });
    }

    // Function to set external participant defaults
    function setExternalParticipantDefaults() {
        console.log('Setting external participant defaults...');
        Object.keys(defaultExternalParticipants).forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                const dropdown = element.closest('.RadComboBox');
                if (dropdown) {
                    const setting = defaultExternalParticipants[elementId];
                    const success = setDropdownValue(dropdown, setting.value, setting.text);

                    if (success) {
                        console.log(`Set external participant ${elementId} to: ${setting.text}`);
                    } else {
                        console.error(`Failed to set external participant ${elementId}`);
                    }
                } else {
                    console.error(`Could not find RadComboBox for ${elementId}`);
                }
            } else {
                console.log(`External participant element ${elementId} not found`);
            }
        });
    }

    // Function to setup user change tracking
    function setupUserChangeTracking() {
        console.log('Setting up user change tracking...');
        const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox input.rcbInput');
        participantDropdowns.forEach(input => {
            const dropdown = input.closest('.RadComboBox');
            if (dropdown && isCompensationPlanDropdown(dropdown)) return;

            input.addEventListener('change', (e) => {
                const fieldId = e.target.id || e.target.name;
                userModifiedFields.add(fieldId);
                console.log(`User modified field: ${fieldId}`);
            });

            const arrow = input.closest('.RadComboBox').querySelector('.rcbArrowCell a');
            if (arrow) {
                arrow.addEventListener('click', () => {
                    setTimeout(() => {
                        const fieldId = input.id || input.name;
                        userModifiedFields.add(fieldId);
                        console.log(`User interacted with field: ${fieldId}`);
                    }, 500);
                });
            }
        });
    }

    // Function to apply office configuration (for non-estimator fields)
    function applyOfficeConfig(officeName) {
        const config = officeConfigs[officeName];
        if (!config) {
            console.log('No configuration found for office:', officeName);
            return;
        }

        console.log('Applying office configuration for:', officeName);

        waitForDropdownsReady(document, () => {
            const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox');
            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;

                const participantLabel = getParticipantLabel(dropdown);

                if (['Estimator', 'Supervisor', 'Coordinator'].includes(participantLabel)) {
                    return;
                }

                if (participantLabel === 'Back Office Team' && config[participantLabel]) {
                    const setting = config[participantLabel];
                    const success = setDropdownValue(dropdown, setting.value, setting.text);

                    if (success) {
                        console.log(`Set ${participantLabel} to: ${setting.text} (office default)`);
                    } else {
                        console.error(`Failed to set ${participantLabel}`);
                    }
                    return;
                }

                if (participantLabel && config[participantLabel]) {
                    if (participantLabel === 'Marketing') {
                        const currentValue = getCurrentDropdownValue(dropdown);
                        if (currentValue && currentValue.value && currentValue.value !== '' && currentValue.value !== '3347' && currentValue.text !== 'Select') {
                            console.log(`Preserving Marketing value: ${currentValue.text}`);
                        } else {
                            const setting = config[participantLabel];
                            const success = setDropdownValue(dropdown, setting.value, setting.text, true);

                            if (success) {
                                console.log(`Set ${participantLabel} to: ${setting.text}`);
                            } else {
                                console.error(`Failed to set ${participantLabel}`);
                            }
                        }
                    } else {
                        const setting = config[participantLabel];
                        const success = setDropdownValue(dropdown, setting.value, setting.text, true);

                        if (success) {
                            console.log(`Set ${participantLabel} to: ${setting.text}`);
                        } else {
                            console.error(`Failed to set ${participantLabel}`);
                        }
                    }
                }
            });
            setTimeout(() => setExternalParticipantDefaults(), 200);
        });
    }

    // Function to monitor office dropdown changes
    function setupOfficeMonitor() {
        const officeDropdown = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_Input');
        const officeHiddenField = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_ClientState');

        if (!officeDropdown || !officeHiddenField) {
            console.log('Office dropdown elements not found (may not be on Create Job page)');
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    const newOffice = officeDropdown.value;
                    if (newOffice && officeConfigs[newOffice]) {
                        console.log('Office changed to:', newOffice);
                        setTimeout(() => applyOfficeConfig(newOffice), 300);
                    }
                }
            });
        });

        observer.observe(officeDropdown, { attributes: true, attributeFilter: ['value'] });
        observer.observe(officeHiddenField, { attributes: true, attributeFilter: ['value'] });

        officeDropdown.addEventListener('change', () => {
            const officeName = officeDropdown.value;
            if (officeName && officeConfigs[officeName]) {
                console.log('Office selected:', officeName);
                setTimeout(() => applyOfficeConfig(officeName), 300);
            }
        });
        console.log('Office monitor setup complete');
    }

    // Check if we're on the Create Job page
    function isCreateJobPage() {
        return window.location.pathname.includes('CreateJob.aspx');
    }

    // Initialize when page is ready
    function initialize() {
        console.log('SERVPRO Auto-Fill script v5.4 initialized (with improved detection)');

        setupEditModalMonitor();

        if (isCreateJobPage()) {
            console.log('On Create Job page, setting up full monitoring');
            setupOfficeMonitor();
            setTimeout(() => setupUserChangeTracking(), 1000);
            setTimeout(() => setupEstimatorMonitor(), 1500);
            setTimeout(() => setExternalParticipantDefaults(), 800);

            const currentOffice = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_Input');
            if (currentOffice && currentOffice.value && officeConfigs[currentOffice.value]) {
                console.log('Found default office:', currentOffice.value);
                setTimeout(() => applyOfficeConfig(currentOffice.value), 1200);
            } else {
                console.log('No office detected, applying Chesterfield defaults');
                setTimeout(() => applyOfficeConfig('SERVPRO of Chesterfield'), 1200);
            }
        } else {
            console.log('Not on Create Job page, only monitoring for Edit Job modal');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

// ==================== ST. PATRICK'S DAY THEME (March 17, 2026) ====================
// Add this section to your existing SERVPRO script

(function() {
    'use strict';

    // Check if today is St. Patrick's Day 2026 (March 17, 2026)
    const today = new Date();
    const isStPatricksDay = (today.getMonth() === 2 && today.getDate() === 17 && today.getFullYear() === 2026);

    if (!isStPatricksDay) {
        return; // Exit if not St. Patrick's Day 2026
    }

    // ==================== FALLING CLOVERS ====================

    function createFallingClovers() {
        if (window.location.pathname.includes('/Calendar')) {
            return;
        }

        const cloverContainer = document.createElement('div');
        cloverContainer.id = 'clover-container';
        cloverContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(cloverContainer);

        const cloverImageUrl = 'https://raw.githubusercontent.com/SBrowningSERVPRO/TampermonkeyScript/main/Clover.png';

        if (!window.stPatricksMouse) {
            window.stPatricksMouse = { x: -1000, y: -1000 };
        }

        window.addEventListener('mousemove', function(e) {
            window.stPatricksMouse.x = e.clientX;
            window.stPatricksMouse.y = e.clientY;
        }, true);

        const activeClovers = [];

        function createClover() {
            const clover = document.createElement('img');
            clover.src = cloverImageUrl;
            clover.className = 'falling-clover';

            let currentX = Math.random() * window.innerWidth;
            let velocityX = 0;
            const size = Math.random() * 20 + 20;
            const duration = Math.random() * 10 + 15;
            const delay = Math.random() * 5;
            const fallSpeed = (window.innerHeight + 50) / (duration * 60);
            let currentY = -50;
            let rotation = Math.random() * 360;
            const rotationSpeed = (Math.random() - 0.5) * 4;
            const driftSpeed = (Math.random() - 0.5) * 1;

            clover.style.cssText = `
                position: fixed;
                left: ${currentX}px;
                top: -50px;
                width: ${size}px;
                height: ${size}px;
                opacity: ${Math.random() * 0.4 + 0.6};
                transform: rotate(${rotation}deg);
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                will-change: transform;
                z-index: 9999;
            `;

            cloverContainer.appendChild(clover);

            const cloverData = { element: clover, x: currentX, y: currentY, velocityX: velocityX };
            activeClovers.push(cloverData);

            let animationStartTime = Date.now() + (delay * 1000);
            let lastTime = Date.now();
            let isActive = true;

            function animate() {
                if (!isActive) return;

                const now = Date.now();

                if (now < animationStartTime) {
                    requestAnimationFrame(animate);
                    return;
                }

                const deltaTime = Math.min((now - lastTime) / 16.67, 3);
                lastTime = now;

                currentY += fallSpeed * deltaTime;
                currentX += driftSpeed * deltaTime;

                const mouseX = window.stPatricksMouse.x;
                const mouseY = window.stPatricksMouse.y;

                if (mouseX > 0) {
                    const dx = currentX - mouseX;
                    const dy = currentY - mouseY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const repelRadius = 150;

                    if (distance < repelRadius && distance > 1) {
                        const force = Math.pow((repelRadius - distance) / repelRadius, 2) * 10;
                        const angle = Math.atan2(dy, dx);
                        velocityX += Math.cos(angle) * force;
                        currentX += Math.cos(angle) * force * deltaTime;
                    }
                }

                currentX += velocityX * deltaTime;
                velocityX *= 0.92;
                rotation += rotationSpeed * deltaTime;

                if (currentX < -100) currentX = -100;
                if (currentX > window.innerWidth + 100) currentX = window.innerWidth + 100;

                clover.style.left = currentX + 'px';
                clover.style.top = currentY + 'px';
                clover.style.transform = `rotate(${rotation}deg)`;

                cloverData.x = currentX;
                cloverData.y = currentY;
                cloverData.velocityX = velocityX;

                if (currentY < window.innerHeight + 100) {
                    requestAnimationFrame(animate);
                } else {
                    isActive = false;
                    clover.remove();
                    const index = activeClovers.indexOf(cloverData);
                    if (index > -1) activeClovers.splice(index, 1);
                    createClover();
                }
            }

            requestAnimationFrame(animate);
        }

        const numberOfClovers = 15;
        for (let i = 0; i < numberOfClovers; i++) {
            setTimeout(() => createClover(), i * 500);
        }
    }

    // ==================== GOLD COIN EXPLOSION ====================

    function createGoldCoinExplosion(button) {
        const coinContainer = document.createElement('div');
        coinContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(coinContainer);

        function createCoin() {
            const coin = document.createElement('div');
            coin.className = 'gold-coin';

            const startX = Math.random() * window.innerWidth;
            const startY = -50;
            const endX = startX + (Math.random() - 0.5) * 300;
            const endY = window.innerHeight + 100;
            const size = Math.random() * 20 + 30;
            const duration = Math.random() * 1 + 2.5;
            const rotationSpeed = Math.random() * 720 + 360;
            const delay = Math.random() * 0.5;

            coin.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                font-size: ${size}px;
                animation: coinFallDown ${duration}s ease-in ${delay}s forwards;
                transform-origin: center;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                z-index: 10001;
            `;

            coin.style.setProperty('--startX', `${startX}px`);
            coin.style.setProperty('--endX', `${endX}px`);
            coin.style.setProperty('--startY', `${startY}px`);
            coin.style.setProperty('--endY', `${endY}px`);
            coin.style.setProperty('--rotation', `${rotationSpeed}deg`);

            const coinEmojis = ['🪙', '💰', '🍀', '🌟'];
            coin.textContent = coinEmojis[Math.floor(Math.random() * coinEmojis.length)];

            coinContainer.appendChild(coin);

            setTimeout(() => {
                coin.remove();
            }, (duration + delay) * 1000 + 100);
        }

        if (!document.getElementById('coin-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'coin-animation-styles';
            style.textContent = `
                @keyframes coinFallDown {
                    0% {
                        transform: translateX(0) translateY(0) rotate(0deg) scale(1);
                        opacity: 0;
                    }
                    5% {
                        opacity: 1;
                    }
                    10% {
                        transform: translateX(calc(var(--endX) - var(--startX))) translateY(10vh) rotate(72deg) scale(1.1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(calc(var(--endX) - var(--startX))) translateY(calc(var(--endY) - var(--startY))) rotate(var(--rotation)) scale(0.8);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const numberOfCoins = 50;
        for (let i = 0; i < numberOfCoins; i++) {
            setTimeout(() => createCoin(), i * 20);
        }

        setTimeout(() => {
            coinContainer.remove();
        }, 5000);
    }

    // ==================== BUTTON MONITORING ====================

    function setupCreateJobButtonMonitor() {
        function findAndSetupButton() {
            let createButton = document.querySelector('a[href*="CreateJob.aspx"]');

            if (!createButton) {
                const possibleSelectors = [
                    'a[href*="CreateJob"]',
                    'input[value*="Create"]',
                    '.create-job-btn',
                    '#createJobButton',
                    'img[alt="Create Job"]',
                    'img[title="Create Job"]'
                ];

                for (const selector of possibleSelectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (const el of elements) {
                            if (el.tagName === 'IMG') {
                                const parentLink = el.closest('a');
                                if (parentLink && parentLink.href && parentLink.href.includes('CreateJob')) {
                                    createButton = parentLink;
                                    break;
                                }
                            } else {
                                const text = el.textContent || el.value || '';
                                if (text.toLowerCase().includes('create') &&
                                    (text.toLowerCase().includes('job') || text.toLowerCase().includes('new'))) {
                                    createButton = el;
                                    break;
                                }
                            }
                        }
                        if (createButton) break;
                    } catch (e) {
                        // Ignore selector errors
                    }
                }
            }

            if (!createButton) {
                const allLinks = document.querySelectorAll('a[href*="Job"]');
                for (const link of allLinks) {
                    if (link.href.includes('CreateJob')) {
                        createButton = link;
                        break;
                    }
                }
            }

            if (createButton) {
                createButton.addEventListener('click', function(e) {
                    sessionStorage.setItem('stpatricks_triggerCoins', 'true');
                    const rect = this.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    sessionStorage.setItem('stpatricks_buttonX', centerX.toString());
                    sessionStorage.setItem('stpatricks_buttonY', centerY.toString());
                }, true);

                createButton.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.5)';
                createButton.style.transition = 'box-shadow 0.3s';
                createButton.style.borderRadius = '4px';

                createButton.addEventListener('mouseenter', function() {
                    this.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.8)';
                });

                createButton.addEventListener('mouseleave', function() {
                    this.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.5)';
                });

                return true;
            }

            return false;
        }

        if (findAndSetupButton()) {
            return;
        }

        const observer = new MutationObserver((mutations) => {
            if (findAndSetupButton()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        const checkInterval = setInterval(() => {
            if (findAndSetupButton()) {
                clearInterval(checkInterval);
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(checkInterval);
            observer.disconnect();
        }, 30000);
    }

    // ==================== CHECK FOR PENDING COIN EXPLOSION ====================

    function checkForPendingCoinExplosion() {
        const shouldTrigger = sessionStorage.getItem('stpatricks_triggerCoins');

        if (shouldTrigger === 'true') {
            let centerX = sessionStorage.getItem('stpatricks_buttonX');
            let centerY = sessionStorage.getItem('stpatricks_buttonY');

            if (!centerX || !centerY) {
                centerX = window.innerWidth / 2;
                centerY = window.innerHeight / 2;
            } else {
                centerX = parseFloat(centerX);
                centerY = parseFloat(centerY);
            }

            sessionStorage.removeItem('stpatricks_triggerCoins');
            sessionStorage.removeItem('stpatricks_buttonX');
            sessionStorage.removeItem('stpatricks_buttonY');

            const fakeButton = document.createElement('div');
            fakeButton.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 1px;
                height: 1px;
                pointer-events: none;
            `;
            document.body.appendChild(fakeButton);

            setTimeout(() => {
                createGoldCoinExplosion(fakeButton);
                setTimeout(() => fakeButton.remove(), 2000);
            }, 300);
        }
    }

    // ==================== ADD ST. PATRICK'S HEADER ====================

    function addStPatricksHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #228B22 0%, #32CD32 50%, #228B22 100%);
            color: white;
            text-align: center;
            padding: 10px;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: bold;
            z-index: 9998;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        header.innerHTML = '🍀 Happy St. Patrick\'s Day! 🍀 May the luck of the Irish be with you! 💚';
        document.body.appendChild(header);

        document.body.style.paddingTop = '50px';
    }

    // ==================== INITIALIZE ====================

    function initializeStPatricksDay() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        function init() {
            checkForPendingCoinExplosion();
            setTimeout(() => createFallingClovers(), 500);
            setTimeout(() => addStPatricksHeader(), 100);
            setTimeout(() => setupCreateJobButtonMonitor(), 1000);
        }
    }

    initializeStPatricksDay();

})();

// ==================== END ST. PATRICK'S DAY THEME ====================

})();
