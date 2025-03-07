import { funcWithRetry } from '../lib/common-utils'
import { cleanChildNodes } from '../lib/dom-utils'
import { UserInformation } from '../lib/interfaces'
import { Trie } from '../lib/trie'
import { indexUserList } from '../lib/user-list-indexer'

let userList: Trie<UserInformation> | null = null

const userListSearcherInit = async () => {
  userList = await indexUserList()
  if (!userList) {
    return
  }

  const appendTarget = document.getElementById('list_viewer')
  if (!appendTarget) {
    throw new Error('appendTarget not found')
  }
  const userListNode = appendTarget.querySelector('#userList')
  if (!userListNode) {
    throw new Error('userListNode not found')
  }
  const effectiveBoxNode = userListNode.querySelector('.effective_box')
  if (!effectiveBoxNode) {
    throw new Error('effectiveBoxNode not found')
  }
  const effectiveList = effectiveBoxNode.querySelector('.effective_list') as HTMLElement
  if (!effectiveList) {
    throw new Error('effectiveList not found')
  }

  const searchInput = createSearchInput()
  searchInput.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement
    if (!target.value) {
      userListNode.scrollTop += 1 // force reflow
      return
    }

    const userInfos: UserInformation[] = []
    const searchRes = userList!.search(target.value)
    if (searchRes?.value) {
      userInfos.push(searchRes.value)
    }
    if (searchRes) {
      const nearByItems = userList!.nearByItems(searchRes) ?? []
      userInfos.push(...nearByItems)
    }

    cleanChildNodes(effectiveList)
    const title = createTitle('검색 결과')
    effectiveList.appendChild(title)
    userInfos.forEach((userInfo) => {
      const { userId, nickname, grade } = userInfo
      const userDiv = createUserListDiv(grade)
      const userAnchor = createUserListAnchor(userId, nickname, grade)
      const userNickSpan = createSimpleSpan(nickname)
      const userNickWithIdSpan = createSimpleSpan(`(${userInfo.userId})`)
      userAnchor.appendChild(userNickSpan)
      userAnchor.appendChild(userNickWithIdSpan)
      userDiv.appendChild(userAnchor)
      effectiveList.appendChild(userDiv)
    })
  })
  appendTarget.insertBefore(searchInput, userListNode)

  const refreshButton = appendTarget.querySelector('.refresh') as HTMLElement
  refreshButton.addEventListener('click', async () => {
    userList = await indexUserList()
  })
}

const createTitle = (textContent: string) => {
  const title = document.createElement('div')
  title.classList.add('title')
  title.textContent = textContent
  return title
}

const createUserListDiv = (grade: string) => {
  const userDiv = document.createElement('div')
  userDiv.classList.add(grade)
  return userDiv
}

const createUserListAnchor = (userId: string, nickname: string, grade: string) => {
  const userAnchor = document.createElement('a')
  userAnchor.setAttribute('href', 'javascript:;')
  userAnchor.setAttribute('user_id', userId)
  userAnchor.setAttribute('user_nick', nickname)
  userAnchor.setAttribute('grade', grade)
  return userAnchor
}

const createSimpleSpan = (textContent: string) => {
  const span = document.createElement('span')
  span.textContent = textContent
  return span
}

const createSearchInput = () => {
  const searchInput = document.createElement('input')
  searchInput.setAttribute('id', 'searchInput')
  searchInput.setAttribute('type', 'text')
  searchInput.setAttribute('placeholder', '닉네임 검색')
  searchInput.setAttribute('autocomplete', 'off')

  return searchInput
}

funcWithRetry(userListSearcherInit, 300)

const indexInterval = setInterval(async () => {
  userList = await indexUserList()
  if (!userList) {
    console.log('cron indexint failed')
    clearInterval(indexInterval)
    return
  }
}, 1000 * 60 * 3)
