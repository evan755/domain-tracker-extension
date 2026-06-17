import { useEffect, useState } from 'react';

interface GetDomainsResponse {
    domains?: string[];
}

interface LocalConfig {
    apiUrl?: string;
    apiKey?: string;
}

export default function Popup() {
    const [domains, setDomains] = useState<string[]>([]);
    const [siteTitle, setSiteTitle] = useState('');
    const [status, setStatus] = useState<{ text: string; isError: boolean; showConfigLink?: boolean }>({ text: '', isError: false });

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (!tab?.id) return;

            if (tab.title) {
                setSiteTitle(tab.title);
            } else if (tab.url) {
                setSiteTitle(new URL(tab.url).hostname);
            }

            chrome.runtime.sendMessage({ action: "getDomains", tabId: tab.id }, (response: GetDomainsResponse) => {
                if (response?.domains) {
                    setDomains(response.domains);
                }
            });
        });
    }, []);

    const handleSync = async () => {
        if (!siteTitle.trim()) {
            setStatus({ text: '⚠️ 站点标题不能为空，请输入有效名称', isError: true });
            return;
        }

        if (domains.length === 0) {
            setStatus({ text: '⚠️ 暂无有效数据，请先刷新目标网页进行捕获', isError: true });
            return;
        }

        setStatus({ text: '正在读取同步配置...', isError: false });
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) {
            setStatus({ text: '❌ 无法获取当前标签页 URL', isError: true });
            return;
        }

        chrome.storage.local.get(['apiUrl', 'apiKey'], async (config: LocalConfig) => {
            if (!config.apiUrl || !config.apiKey) {
                setStatus({ text: '请先完成配置：', isError: true, showConfigLink: true });
                return;
            }

            try {
                setStatus({ text: '🚀 正在安全上传至云端...', isError: false });

                const res = await fetch(`${config.apiUrl}/api/save-domains`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`
                    },
                    body: JSON.stringify({
                        source_site: tab.url,
                        site_title: siteTitle.trim(),
                        domains
                    })
                });

                if (res.ok) {
                    setStatus({ text: '✅ 数据同步成功！', isError: false });
                } else {
                    setStatus({ text: `❌ 同步失败 (HTTP ${res.status})`, isError: true, showConfigLink: true });
                }
            } catch {
                setStatus({ text: '❌ 无法连接到配置的 API 接口基地址，请检查配置', isError: true, showConfigLink: true });
            }
        });
    };

    return (
        <div className="w-[340px] p-4 bg-white text-gray-800 flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                <h3 className="text-sm font-bold text-blue-600">已加载主域名</h3>
                <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{domains.length}</span>
            </div>

            <div className="mb-3">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">当前站点标题 (允许修改)</label>
                <input
                    type="text"
                    value={siteTitle}
                    onChange={e => {
                        setSiteTitle(e.target.value);
                        if (e.target.value.trim() && status.text.includes('标题不能为空')) {
                            setStatus({ text: '', isError: false });
                        }
                    }}
                    placeholder="请输入站点标题，不能为空"
                    className={`w-full text-xs p-2 border rounded focus:outline-none transition-colors ${
                        !siteTitle.trim()
                            ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                            : 'border-gray-200 focus:border-blue-500'
                    }`}
                />
            </div>

            <ul className="border border-gray-200 rounded max-h-36 overflow-y-auto divide-y divide-gray-100">
                {domains.length > 0 ? (
                    domains.map(d => (
                        <li key={d} className="p-2 text-xs truncate hover:bg-gray-50 transition-colors">{d}</li>
                    ))
                ) : (
                    <li className="p-4 text-center text-xs text-gray-400">暂无捕获数据 (请刷新页面)</li>
                )}
            </ul>

            <button
                onClick={handleSync}
                disabled={!siteTitle.trim()}
                className={`mt-4 w-full text-white font-medium py-2 rounded text-xs transition-all ${
                    !siteTitle.trim()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                }`}
            >
                同步数据至远程数据库
            </button>

            {status.text && (
                <div className={`mt-2 text-center text-xs p-1.5 rounded transition-all border ${
                    status.isError ? 'text-red-500 bg-red-50 border-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                }`}>
                    <span>{status.text}</span>
                    {status.isError && status.showConfigLink && (
                        <button
                            type="button"
                            className="text-blue-600 underline ml-1 cursor-pointer font-semibold focus:outline-none"
                            onClick={() => chrome.runtime.openOptionsPage()}
                        >
                            点击去配置
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}