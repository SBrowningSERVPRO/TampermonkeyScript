// ==UserScript==
// @name         SERVPRO Office Auto-Fill
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Auto-fill participant dropdowns based on selected SERVPRO office
// @author       You
// @match        https://servpro.ngsapps.net/Enterprise/Module/Job/CreateJob.aspx
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Track which fields have been manually changed by the user
    const userModifiedFields = new Set();

    // Configuration for each office with their specific participant assignments
    const officeConfigs = {
        'SERVPRO of Chesterfield': {
            'Supervisor': { value: '', text: 'Select' },
            'Foreman': { value: '3347', text: 'Not, Applicable' },
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
            'Mit JFC TL': { value: '163296', text: 'Gardner, Jon' }
        },
        'SERVPRO of Chesapeake': {
            'Supervisor': { value: '', text: 'Select' },
            'Foreman': { value: '3347', text: 'Not, Applicable' },
            'Accounting': { value: '140311', text: 'Shippee, Kathryn' },
            'Marketing': { value: '3347', text: 'Not, Applicable' },
            'Recon PM': { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '140311', text: 'Shippee, Kathryn' },
            'Back Office Team': { value: '3347', text: 'Not, Applicable' },
            'Recon Follow Up': { value: '77219', text: 'Hubbell, Stacey' },
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
            'Mit JFC TL': { value: '163296', text: 'Gardner, Jon' }
        },
        'SERVPRO of Arlington': {
            'Supervisor': { value: '177988', text: 'Arlington, Team' },
            'Foreman': { value: '3347', text: 'Not, Applicable' },
            'Accounting': { value: '177881', text: 'Matta, Sreelakshmi' },
            'Marketing': { value: '3347', text: 'Not, Applicable' },
            'Recon PM': { value: '3347', text: 'Not, Applicable' },
            'Accounts Receivable': { value: '177881', text: 'Matta, Sreelakshmi' },
            'Back Office Team': { value: '179363', text: 'Team, Water' },
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
            'Mit JFC TL': { value: '163296', text: 'Gardner, Jon' }
        }
    };

    // Default external participant values that should always be set
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

    // Function to set dropdown value
    function setDropdownValue(comboBoxElement, value, text, forceUpdate = false) {
        const input = comboBoxElement.querySelector('input.rcbInput');
        const hiddenField = comboBoxElement.querySelector('input[type="hidden"][name*="_ClientState"]');

        if (!input || !hiddenField) return false;

        // Get a unique identifier for this field
        const fieldId = input.id || input.name;

        // Don't override user changes unless forced
        if (!forceUpdate && userModifiedFields.has(fieldId)) {
            console.log(`Skipping ${fieldId} - user has modified this field`);
            return true;
        }

        // Update the visible input
        input.value = text;

        // Handle empty/Select values
        if (value === '' || text === 'Select') {
            // For empty values, set proper empty state
            const emptyClientState = {
                logEntries: [],
                value: "",
                text: "",
                enabled: true,
                checkedIndices: [],
                checkedItemsTextOverflows: false
            };
            hiddenField.value = JSON.stringify(emptyClientState);

            // Add the empty message class if needed
            if (!input.classList.contains('rcbEmptyMessage')) {
                input.classList.add('rcbEmptyMessage');
            }
        } else {
            // Update the hidden field with the client state JSON
            const clientState = {
                logEntries: [],
                value: value,
                text: text,
                enabled: true,
                checkedIndices: [],
                checkedItemsTextOverflows: false
            };

            hiddenField.value = JSON.stringify(clientState);
            // Remove the empty message class
            input.classList.remove('rcbEmptyMessage');
        }

        // Trigger change events
        input.dispatchEvent(new Event('change', { bubbles: true }));
        hiddenField.dispatchEvent(new Event('change', { bubbles: true }));

        return true;
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

        // Track changes to internal participant dropdowns
        const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox input.rcbInput');
        participantDropdowns.forEach(input => {
            input.addEventListener('change', (e) => {
                const fieldId = e.target.id || e.target.name;
                userModifiedFields.add(fieldId);
                console.log(`User modified field: ${fieldId}`);
            });

            // Also track clicks on the dropdown
            const arrow = input.closest('.RadComboBox').querySelector('.rcbArrowCell a');
            if (arrow) {
                arrow.addEventListener('click', () => {
                    setTimeout(() => {
                        const fieldId = input.id || input.name;
                        userModifiedFields.add(fieldId);
                        console.log(`User interacted with field: ${fieldId}`);
                    }, 500); // Wait for potential selection
                });
            }
        });
    }

    // Function to apply office configuration
    function applyOfficeConfig(officeName) {
        const config = officeConfigs[officeName];
        if (!config) {
            console.log('No configuration found for office:', officeName);
            return;
        }

        console.log('Applying configuration for:', officeName);

        // Find all participant dropdown elements
        const participantDropdowns = document.querySelectorAll('div[id*="EstimatorComboBox"].RadComboBox');

        participantDropdowns.forEach(dropdown => {
            const participantLabel = getParticipantLabel(dropdown);

            if (participantLabel && config[participantLabel]) {
                const setting = config[participantLabel];
                // Force update for office changes
                const success = setDropdownValue(dropdown, setting.value, setting.text, true);

                if (success) {
                    console.log(`Set ${participantLabel} to: ${setting.text}`);
                } else {
                    console.error(`Failed to set ${participantLabel}`);
                }
            } else if (participantLabel) {
                // For participants not in config (like Estimator, Coordinator), leave as "Select"
                console.log(`No configuration for ${participantLabel}, leaving as Select`);
            }
        });

        // Always set external participant defaults after setting office-specific config
        setTimeout(() => setExternalParticipantDefaults(), 200);
    }

    // Function to monitor office dropdown changes
    function setupOfficeMonitor() {
        const officeDropdown = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_Input');
        const officeHiddenField = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_ClientState');

        if (!officeDropdown || !officeHiddenField) {
            console.error('Office dropdown elements not found');
            return;
        }

        // Monitor for changes to the office selection
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    const newOffice = officeDropdown.value;
                    if (newOffice && officeConfigs[newOffice]) {
                        console.log('Office changed to:', newOffice);
                        // Small delay to ensure the page has updated
                        setTimeout(() => applyOfficeConfig(newOffice), 100);
                    }
                }
            });
        });

        observer.observe(officeDropdown, { attributes: true, attributeFilter: ['value'] });
        observer.observe(officeHiddenField, { attributes: true, attributeFilter: ['value'] });

        // Also listen for change events
        officeDropdown.addEventListener('change', () => {
            const officeName = officeDropdown.value;
            if (officeName && officeConfigs[officeName]) {
                console.log('Office selected:', officeName);
                setTimeout(() => applyOfficeConfig(officeName), 100);
            }
        });

        console.log('Office monitor setup complete');
    }

    // Initialize when page is ready
    function initialize() {
        console.log('SERVPRO Auto-Fill script initialized');

        // Set up monitoring for office changes
        setupOfficeMonitor();

        // Set up user change tracking
        setTimeout(() => setupUserChangeTracking(), 1000);

        // Always set external participant defaults first
        setTimeout(() => setExternalParticipantDefaults(), 500);

        // Check if there's already a default office selected and apply its config
        const currentOffice = document.querySelector('#ctl00_ContentPlaceHolder1_JobParentInformation_GenaralInfo_comboBoxOffice_Input');
        if (currentOffice && currentOffice.value && officeConfigs[currentOffice.value]) {
            console.log('Found default office:', currentOffice.value);
            setTimeout(() => applyOfficeConfig(currentOffice.value), 700);
        }
    }

    // Wait for the page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
