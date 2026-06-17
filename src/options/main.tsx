import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import Options from './Options'

const container = document.getElementById('options-root')
if (!container) {
    throw new Error('未找到 options-root 挂载节点，请检查 options.html 结构是否完整。')
}

createRoot(container).render(
    <StrictMode>
        <Options/>
    </StrictMode>
)