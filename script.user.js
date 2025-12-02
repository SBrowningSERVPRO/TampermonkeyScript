// ==UserScript==
// @name         SERVPRO Office Auto-Fill
// @namespace    http://tampermonkey.net/
// @version      5.7
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

        // Wait for dropdowns to be fully loaded
        waitForDropdownsReady(iframeDoc, () => {
            const participantDropdowns = iframeDoc.querySelectorAll('div[id*="Estimator"].RadComboBox, div[id*="EstimatorComboBox"].RadComboBox');
            let estimatorDropdown = null;

            participantDropdowns.forEach(dropdown => {
                if (isCompensationPlanDropdown(dropdown)) return;

                const label = getParticipantLabel(dropdown);
                if (label === 'Estimator') {
                    estimatorDropdown = dropdown;
                }
            });

            if (!estimatorDropdown) {
                console.log('Estimator dropdown not found in edit modal');
                return;
            }

            const estimatorInput = estimatorDropdown.querySelector('input.rcbInput');
            const estimatorHiddenField = estimatorDropdown.querySelector('input[type="hidden"][name*="_ClientState"]');

            if (!estimatorInput || !estimatorHiddenField) {
                console.log('Estimator input elements not found in edit modal');
                return;
            }

            // Monitor for changes to estimator selection
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                        try {
                            const clientState = JSON.parse(estimatorHiddenField.value);
                            if (clientState && clientState.value) {
                                console.log('Edit modal estimator changed:', clientState.value);
                                setTimeout(() => {
                                    applyEstimatorConfig(clientState.value, iframeDoc);
                                }, 200);
                            }
                        } catch (e) {
                            console.log('Could not parse estimator client state in edit modal');
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
                            console.log('Edit modal estimator changed (via event):', clientState.value);
                            applyEstimatorConfig(clientState.value, iframeDoc);
                        }
                    } catch (e) {
                        console.log('Could not parse estimator client state on change in edit modal');
                    }
                }, 200);
            });

            console.log('Edit modal estimator monitoring setup complete');
        });
    }

    // Function to monitor for Edit Job Information modal
    function setupEditModalMonitor() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.id === 'RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common') {
                        console.log('Edit Job Information modal detected. Waiting for iframe to be ready...');

                        const iframeName = "RadWindow_Common";
                        let attempts = 0;
                        const maxAttempts = 30; // Increased to 15 seconds
                        const retryInterval = 500;

                        function trySetupModal() {
                            const modal = document.querySelector('#RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common');
                            if (!modal) {
                                console.log('Modal disappeared, stopping setup.');
                                return;
                            }

                            const iframe = modal.querySelector(`iframe[name="${iframeName}"]`);
                            if (iframe) {
                                try {
                                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                    if (iframeDoc && iframeDoc.readyState === 'complete' && iframeDoc.body && iframeDoc.body.children.length > 0) {
                                        console.log('Edit modal iframe is ready, setting up monitoring.');
                                        // Add extra delay to ensure all scripts have initialized
                                        setTimeout(() => {
                                            setupEditModalEstimatorMonitor(iframeDoc);
                                        }, 500);
                                    } else {
                                        throw new Error('Iframe not ready');
                                    }
                                } catch (e) {
                                    attempts++;
                                    if (attempts < maxAttempts) {
                                        console.log(`Iframe not ready, retrying... (Attempt ${attempts}/${maxAttempts})`);
                                        setTimeout(trySetupModal, retryInterval);
                                    } else {
                                        console.error(`Failed to access edit modal iframe content after ${maxAttempts * retryInterval}ms.`);
                                    }
                                }
                            } else {
                                attempts++;
                                if (attempts < maxAttempts) {
                                    console.log(`Iframe not found, retrying... (Attempt ${attempts}/${maxAttempts})`);
                                    setTimeout(trySetupModal, retryInterval);
                                } else {
                                    console.error(`Failed to find edit modal iframe after ${maxAttempts * retryInterval}ms.`);
                                }
                            }
                        }
                        setTimeout(trySetupModal, 250);
                    }
                });

                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.id === 'RadWindowWrapper_ctl00_ContentPlaceHolder1_RadWindow_Common') {
                        console.log('Edit Job Information modal closed');
                        isEditMode = false;
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('Edit modal monitor setup complete');
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

})();
