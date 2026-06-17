interface TabDomains {
    [tabId: number]: Set<string>;
}

interface IncomingMessage {
    action: 'getDomains';
    tabId: number;
}

const tabDomains: TabDomains = {};

/**
 * 从 URL 中提取主域名。
 * 处理双后缀 TLD（如 .co.uk、.com.cn），取最后 3 段；普通域名取最后 2 段。
 */
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

// 拦截所有网络请求，提取主域名并按 tabId 累积
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const { tabId, url } = details;
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
    { urls: ["<all_urls>"] }
);

// 仅在 URL 真正变化时清空该 tab 的域名集合（忽略 loading 等非导航状态变更）
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
        if (!tabDomains[tabId]) {
            tabDomains[tabId] = new Set<string>();
        } else {
            tabDomains[tabId].clear();
        }
    }
});

// 标签页关闭时释放内存
chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabDomains[tabId];
});

// 同步响应 popup 的域名查询请求
chrome.runtime.onMessage.addListener((message: IncomingMessage, _sender, sendResponse) => {
    if (message && message.action === "getDomains") {
        const targetTabId = message.tabId;
        const domains = tabDomains[targetTabId] ? Array.from(tabDomains[targetTabId]) : [];
        sendResponse({ domains: domains.sort() });
    }
    // 无异步操作，不返回 true，让 Chrome 立即释放通信管道
    return false;
});