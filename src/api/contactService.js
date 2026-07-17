import apiClient from './osimart'

const STORE_ID = import.meta.env.VITE_OSIMART_STORE_ID

export const contactService = {
  async sendMessage(data) {
    const response = await apiClient.post('/contactmessage/', {
      ...data,
      store_id: STORE_ID
    })

    return response.data
  }
}