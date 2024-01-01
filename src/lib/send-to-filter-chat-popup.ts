export default (node: HTMLElement) => {
  const targetElement = document.getElementById('userFilteredChatPopupInner')
  if (!targetElement) {
    console.error('userFilteredChatPopupInner element not found')
    return
  }
  targetElement.appendChild(node.cloneNode(true))
}
