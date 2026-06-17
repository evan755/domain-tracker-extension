import { useEffect, useState } from 'react';

export default function Options() {
    const [apiUrl, setApiUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        chrome.storage.local.get(['apiUrl', 'apiKey'], (result: Record<string, unknown>) => {
            if (typeof result.apiUrl === 'string') setApiUrl(result.apiUrl);
            if (typeof result.apiKey === 'string') setApiKey(result.apiKey);
        });
    }, []);

    const handleSave = () => {
        chrome.storage.local.set({ apiUrl: apiUrl.trim().replace(/\/$/, ""), apiKey: apiKey.trim() }, () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-sm w-96 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">API 安全网关配置</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">API 接口基地址 (Base URL)</label>
                        <input type="text" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="例如: http://localhost:3000" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">API Key (鉴权 Token)</label>
                        <div className="relative">
                            <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="输入您的后端通信密钥" className="w-full text-sm p-2 pr-12 border border-gray-300 rounded focus:border-blue-500 focus:outline-none" />
                            <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-600 px-1.5 py-1">
                                {showKey ? '隐藏' : '显示'}
                            </button>
                        </div>
                    </div>
                    <button onClick={handleSave} className={`w-full font-medium py-2 rounded text-sm transition ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {saved ? '✅ 配置已成功保存' : '保存系统配置'}
                    </button>
                </div>
            </div>
        </div>
    );
}