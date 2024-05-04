import { useQuery } from '@tanstack/react-query'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import SettingsIcon from '@mui/icons-material/Settings'
import { Button, Link, Paper, Skeleton } from '@mui/material'

import { getChatList } from '@/apis/messages'
import { useSignInChange } from '@/states'

import Conversation from './Conversation'
import ConversationList from './ConversationList'

// 这个函数用于尝试将字符串转换为整数，如果无法转换或者转换结果为NaN，则返回undefined
const tryParseInt = (value?: string) => {
  if (value == undefined) {
    return undefined
  }
  const parsedResult = parseInt(value)
  if (isNaN(parsedResult)) {
    return undefined
  }
  return parsedResult
}

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const chatId = tryParseInt(useParams()['plid'])
  const uid = tryParseInt(useParams()['uid'])

  const initQuery = () => {
    return {
      page: parseInt(searchParams.get('page') || '1') || 1,
    }
  }
  const [query, setQuery] = useState(initQuery())
  const { data: chatList, refetch } = useQuery({
    queryKey: ['messages', query],
    queryFn: () => getChatList(query),
    refetchOnMount: true,
  })

  useEffect(() => {
    setQuery(initQuery())
  }, [searchParams])
  useSignInChange(refetch)

  // 状态用于控制全选和删除的显示与隐藏，默认为false
  const [showOptSelect, setShowOptSelect] = useState(false)

  // Toggle function for OptSelect visibility
  const toggleOptSelect = () => {
    setShowOptSelect((prev) => !prev)
  }

  // 记录当前选择的复选框个数
  const [selectedCount, setSelectedCount] = useState(0)

  const handleCheckboxChange = (checked: boolean) => {
    setSelectedCount((prevCount) => (checked ? prevCount + 1 : prevCount - 1))
  }

  const buttonProps = {
    backgroundColor: 'inherit',
    border: 'none',
    fontSize: '14px',
  }

  return (
    <Paper sx={{ flexGrow: 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Button to toggle OptSelect visibility */}
        <p
          style={{
            padding: '0px',
            margin: '0px',
          }}
        >
          <Button
            {...buttonProps}
            sx={(theme) => ({
              margin: '8px',
              width: 'auto',
              color: theme.palette.mode == 'light' ? '#0268FD' : '#90CAF9',
            })}
            onClick={toggleOptSelect}
          >
            {showOptSelect ? '取消选择' : '选择消息'}
          </Button>
          {showOptSelect && (
            <>
              <Button
                {...buttonProps}
                sx={(theme) => ({
                  color: theme.palette.mode == 'light' ? '#0268FD' : '#90CAF9',
                })}
                disabled={selectedCount === 0}
              >
                设为已读
              </Button>
              <Button
                {...buttonProps}
                sx={(theme) => ({
                  color: theme.palette.mode == 'light' ? '#E26666' : '#DF6A6A',
                })}
                disabled={selectedCount === 0}
              >
                删除
              </Button>
              <Button
                {...buttonProps}
                sx={(theme) => ({
                  color: theme.palette.mode == 'light' ? '#0268FD' : '#90CAF9',
                })}
                disabled={selectedCount !== 1}
              >
                举报
              </Button>
            </>
          )}
          {/* 这里的设置好像是用于黑名单的衍生功能 */}
        </p>
        <Link href="/settings/blacklist">
          <Button
            sx={(theme) => ({
              marginRight: '20px',
              width: 'auto',
              backgroundColor: 'inherit',
              border: 'none',
              fontSize: '14px',
              color: theme.palette.mode == 'light' ? '#0268FD' : '#90CAF9',
            })}
          >
            <SettingsIcon sx={{ marginRight: '4px', width: '18px' }} />
            设置
          </Button>
        </Link>
      </div>
      {chatId || uid ? (
        <Conversation
          onCheckboxChange={handleCheckboxChange}
          chatId={chatId}
          uid={uid}
          initialList={query.page == 1 ? chatList?.rows : undefined}
          showOptSelect={showOptSelect}
        />
      ) : chatList ? (
        <ConversationList
          onCheckboxChange={handleCheckboxChange}
          list={chatList.rows}
          pagination={chatList}
          showOptSelect={showOptSelect}
        />
      ) : (
        [...Array(10)].map((_, index) => <Skeleton key={index} height={70} />)
      )}
    </Paper>
  )
}

export default Chat
