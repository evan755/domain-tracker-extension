import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import Popup from './Popup'

const container = document.getElementById('root')
if (!container) {
    throw new Error('未找到 root 挂载节点，请检查 index.html 结构是否完整。')
}

createRoot(container).render(
    <StrictMode>
        <Popup/>
    </StrictMode>
)