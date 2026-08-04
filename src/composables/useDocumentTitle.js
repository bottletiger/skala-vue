import { toValue, watchEffect } from 'vue'

export const useDocumentTitle = (pageTitleSource) => {
  watchEffect(() => {
    const pageTitle = toValue(pageTitleSource)
    document.title = pageTitle ? `${pageTitle} | Weather` : 'Weather'
  })
}
