interface TabDomains {
    [tabId: number]: Set<string>;
}

interface IncomingMessage {
    action: 'getDomains';
    tabId: number;
}

const tabDomains: TabDomains = {};

function getMainDomain(urlStr: string): string | null {
    try {
        const url = new URL(urlStr);
        const hostname = url.hostname;
        const parts = hostname.split('.');
        if (parts.length <= 2) return hostname;

        const last2 = parts.slice(-2).join('.');
        const isDoubleSuffix = /\.(com|net|org|gov|edu|co|ac)\.(cn|uk|jp|tw|hk|sg|au)$/.test('.' + last2);
        return isDoubleSuffix ? parts.slice(-3).join('.') : parts.slice(-2).join('.');
    } catch {
        return null;
    }
}

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const {tabId, url} = details;
        if (tabId === -1) return;
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

        if (!tabDomains[tabId]) {
            tabDomains[tabId] = new Set<string>();
        }
        const domain = getMainDomain(url);
        if (domain) {
            tabDomains[tabId].add(domain);
        }
    },
    {urls: ["<all_urls>"]}
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
        if (!tabDomains[tabId]) {
            tabDomains[tabId] = new Set<string>();
        } else {
            tabDomains[tabId].clear();
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabDomains[tabId];
});

chrome.runtime.onMessage.addListener((message: IncomingMessage, _sender, sendResponse) => {
    if (message && message.action === "getDomains") {
        const targetTabId = message.tabId;
        const domains = tabDomains[targetTabId] ? Array.from(tabDomains[targetTabId]) : [];
        sendResponse({domains: domains.sort()});
    }
    return false;
});
