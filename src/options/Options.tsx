import {useEffect, useState} from 'react';

interface LocalConfig {
    apiUrl?: string;
    apiKey?: string;
}

export default function Options() {
    const [apiUrl, setApiUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<{ text: string; isError: boolean }>({text: '', isError: false});

    useEffect(() => {
        chrome.storage.local.get(['apiUrl', 'apiKey'], (config: LocalConfig) => {
            if (config.apiUrl) setApiUrl(config.apiUrl);
            if (config.apiKey) setApiKey(config.apiKey);
        });
    }, []);

    const handleTest = async () => {
        if (!apiUrl.trim()) {
            setStatus({text: '⚠️ API 接口基础地址不能为空', isError: true});
            return;
        }
        if (!apiKey.trim()) {
            setStatus({text: '⚠️ API Key 不能为空', isError: true});
            return;
        }

        const normalizedUrl = apiUrl.trim().replace(/\/+$/, '');

        setStatus({text: '🔑 正在测试连接...', isError: false});

        try {
            const res = await fetch(`${normalizedUrl}/api/auth`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({apiKey: apiKey.trim()})
            });

            if (!res.ok) {
                setStatus({text: `❌ 测试失败 (HTTP ${res.status})`, isError: true});
                return;
            }

            const data = await res.json();
            if (!data.token) {
                setStatus({text: '❌ 服务端未返回 Token', isError: true});
                return;
            }

            setToken(data.token);
            setApiUrl(normalizedUrl);
            setStatus({text: '✅ 连接成功', isError: false});
        } catch {
            setStatus({text: '❌ 无法连接到服务端，请检查 API 地址', isError: true});
        }
    };

    const handleSave = () => {
        if (!token) {
            setStatus({text: '⚠️ 请先测试连接', isError: true});
            return;
        }

        chrome.storage.local.set({apiUrl: apiUrl.trim().replace(/\/+$/, ''), apiKey: apiKey.trim(), token}, () => {
            setStatus({text: '✅ 配置已保存', isError: false});
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-[340px] p-4 bg-white text-gray-800 flex flex-col shadow-sm rounded-lg">
                <div className="flex items-center border-b border-gray-100 pb-2 mb-3">
                    <h3 className="text-sm font-bold text-gray-900">配置中心</h3>
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
                                : 'border-gray-200 focus:border-gray-900'
                        }`}
                    />
                    <p className="mt-1 text-[10px] text-gray-400">保存时请求 {'{地址}'}/api/auth 获取 Token</p>
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
                                : 'border-gray-200 focus:border-gray-900'
                        }`}
                    />
                    <p className="mt-1 text-[10px] text-gray-400">用于换取 Token，不会直接发送</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleTest}
                        disabled={!apiUrl.trim() || !apiKey.trim()}
                        className={`flex-1 text-white font-medium py-2 rounded text-xs transition-all ${
                            !apiUrl.trim() || !apiKey.trim()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gray-600 hover:bg-gray-700 active:scale-[0.98]'
                        }`}
                    >
                        测试
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!token}
                        className={`flex-1 text-white font-medium py-2 rounded text-xs transition-all ${
                            !token
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gray-900 hover:bg-black active:scale-[0.98]'
                        }`}
                    >
                        保存
                    </button>
                </div>

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
        </div>
    );
}
