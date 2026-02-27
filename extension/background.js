// K-PDF Chrome Extension - Background Service Worker

const K-PDF_URL = 'https://k-pdf.devtoolcafe.com/en';

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // Create main context menu item
    chrome.contextMenus.create({
        id: 'k-pdf-open',
        title: 'Open with K-PDF',
        contexts: ['link', 'page']
    });

    // Create submenu for specific tools
    chrome.contextMenus.create({
        id: 'k-pdf-merge',
        parentId: 'k-pdf-open',
        title: 'Merge PDFs',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'k-pdf-compress',
        parentId: 'k-pdf-open',
        title: 'Compress PDF',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'k-pdf-convert',
        parentId: 'k-pdf-open',
        title: 'Convert to PDF',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'k-pdf-all-tools',
        parentId: 'k-pdf-open',
        title: 'All Tools →',
        contexts: ['link', 'page']
    });

    console.log('K-PDF context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    let url = K-PDF_URL;

    switch (info.menuItemId) {
        case 'k-pdf-merge':
            url = `${K-PDF_URL}/tools/merge-pdf`;
            break;
        case 'k-pdf-compress':
            url = `${K-PDF_URL}/tools/compress-pdf`;
            break;
        case 'k-pdf-convert':
            url = `${K-PDF_URL}/tools/jpg-to-pdf`;
            break;
        case 'k-pdf-all-tools':
        case 'k-pdf-open':
            url = K-PDF_URL;
            break;
        default:
            url = K-PDF_URL;
    }

    // Open K-PDF in a new tab
    chrome.tabs.create({ url: url });
});

// Log when service worker starts
console.log('K-PDF background service worker started');
