import {useEffect, useState} from 'react';

interface LocalConfig {
    apiUrl?: string;
    apiKey?: string;
}

export default function Options() {
    const [apiUrl, setApiUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<{ text: string; isError: boolean }>({text: '', isError: false});

    useEffect(() => {
        chrome.storage.local.get(['apiUrl', 'apiKey'], (config: LocalConfig) => {
            if (config.apiUrl) setApiUrl(config.apiUrl);
            if (config.apiKey) setApiKey(config.apiKey);
        });
    }, []);

    const handleSave = () => {
        if (!apiUrl.trim()) {
            setStatus({text: '⚠️ API 接口基础地址不能为空', isError: true});
            return;
        }
        if (!apiKey.trim()) {
            setStatus({text: '⚠️ API Key 不能为空', isError: true});
            return;
        }

        const normalizedUrl = apiUrl.trim().replace(/\/+$/, '');

        chrome.storage.local.set({apiUrl: normalizedUrl, apiKey: apiKey.trim()}, () => {
            setStatus({text: '✅ 配置已保存', isError: false});
            setApiUrl(normalizedUrl);
        });
    };

    return (
        <div className="w-[340px] p-4 bg-white text-gray-800 flex flex-col">
            <div className="flex items-center border-b border-gray-100 pb-2 mb-3">
                <h3 className="text-sm font-bold text-blue-600">配置中心</h3>
            </div>

            <div className="mb-3">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    API 接口基础地址 <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={apiUrl}
                    onChange={e => {
                        setApiUrl(e.target.value);
                        if (status.text) setStatus({text: '', isError: false});
                    }}
                    placeholder="https://your-api.example.com"
                    className={`w-full text-xs p-2 border rounded focus:outline-none transition-colors ${
                        !apiUrl.trim()
                            ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                            : 'border-gray-200 focus:border-blue-500'
                    }`}
                />
                <p className="mt-1 text-[10px] text-gray-400">同步时请求 {'{地址}'}/api/save-domains</p>
            </div>

            <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    API Key <span className="text-red-400">*</span>
                </label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={e => {
                        setApiKey(e.target.value);
                        if (status.text) setStatus({text: '', isError: false});
                    }}
                    placeholder="输入你的 API Key"
                    className={`w-full text-xs p-2 border rounded focus:outline-none transition-colors ${
                        !apiKey.trim()
                            ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                            : 'border-gray-200 focus:border-blue-500'
                    }`}
                />
                <p className="mt-1 text-[10px] text-gray-400">以 Bearer Token 形式发送</p>
            </div>

            <button
                onClick={handleSave}
                disabled={!apiUrl.trim() || !apiKey.trim()}
                className={`w-full text-white font-medium py-2 rounded text-xs transition-all ${
                    !apiUrl.trim() || !apiKey.trim()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                }`}
            >
                保存配置
            </button>

            {status.text && (
                <div className={`mt-2 text-center text-xs p-1.5 rounded transition-all border ${
                    status.isError
                        ? 'text-red-500 bg-red-50 border-red-100'
                        : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                }`}>
                    {status.text}
                </div>
            )}
        </div>
    );
}
