import {useEffect, useState} from 'react';

interface GetDomainsResponse {
    domains?: string[];
}

interface LocalConfig {
    apiUrl?: string;
    token?: string;
}

export default function Popup() {
    const [domains, setDomains] = useState<string[]>([]);
    const [status, setStatus] = useState<{ text: string; isError: boolean; showConfigLink?: boolean }>({
        text: '',
        isError: false
    });

    useEffect(() => {
        chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
            if (!tab?.id) return;

            chrome.runtime.sendMessage({action: "getDomains", tabId: tab.id}, (response: GetDomainsResponse) => {
                if (response?.domains) {
                    setDomains(response.domains);
                }
            });
        });
    }, []);

    const handleBuild = async () => {
        setStatus({text: '正在读取配置...', isError: false});

        chrome.storage.local.get(['apiUrl', 'token'], async (config: LocalConfig) => {
            if (!config.apiUrl || !config.token) {
                setStatus({text: '请先完成配置：', isError: true, showConfigLink: true});
                return;
            }

            try {
                setStatus({text: '🔨 正在请求构建...', isError: false});

                const res = await fetch(`${config.apiUrl}/api/build`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.token}`
                    }
                });

                if (res.ok) {
                    setStatus({text: '✅ 构建请求已提交！', isError: false});
                } else {
                    setStatus({text: `❌ 构建失败 (HTTP ${res.status})`, isError: true, showConfigLink: true});
                }
            } catch {
                setStatus({text: '❌ 无法连接到配置的 API 接口基地址，请检查配置', isError: true, showConfigLink: true});
            }
        });
    };

    const handleSync = async () => {
        if (domains.length === 0) {
            setStatus({text: '⚠️ 暂无有效数据，请先刷新目标网页进行捕获', isError: true});
            return;
        }

        setStatus({text: '正在读取配置...', isError: false});

        chrome.storage.local.get(['apiUrl', 'token'], async (config: LocalConfig) => {
            if (!config.apiUrl || !config.token) {
                setStatus({text: '请先完成配置：', isError: true, showConfigLink: true});
                return;
            }

            try {
                setStatus({text: '🚀 正在安全上传至云端...', isError: false});

                const res = await fetch(`${config.apiUrl}/api/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.token}`
                    },
                    body: JSON.stringify({domains})
                });

                if (res.ok) {
                    setStatus({text: '✅ 数据同步成功！', isError: false});
                } else {
                    setStatus({text: `❌ 同步失败 (HTTP ${res.status})`, isError: true, showConfigLink: true});
                }
            } catch {
                setStatus({text: '❌ 无法连接到配置的 API 接口基地址，请检查配置', isError: true, showConfigLink: true});
            }
        });
    };

    return (
        <div className="w-[340px] p-4 bg-white text-gray-800 flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                <h3 className="text-sm font-bold text-blue-600">已加载主域名</h3>
                <div className="flex items-center gap-2">
                    <span
                        className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{domains.length}</span>
                    <button
                        type="button"
                        onClick={() => chrome.runtime.openOptionsPage()}
                        className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="配置"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </button>
                </div>
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

            <div className="mt-4 flex gap-2">
                <button
                    onClick={handleSync}
                    disabled={domains.length === 0}
                    className={`flex-1 text-white font-medium py-2 rounded text-xs transition-all ${
                        domains.length === 0
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gray-900 hover:bg-black active:scale-[0.98]'
                    }`}
                >
                    同步数据
                </button>
                <button
                    onClick={handleBuild}
                    className="flex-1 bg-gray-900 hover:bg-black active:scale-[0.98] text-white font-medium py-2 rounded text-xs transition-all"
                >
                    构建配置
                </button>
            </div>

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