import { useQuery } from '@tanstack/react-query'

import { createRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useInView } from 'react-cool-inview'

import { Send } from '@mui/icons-material'
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { ChatMessagesRequest, getChatMessages } from '@/apis/common'
import { ChatConversation, ChatMessage } from '@/common/interfaces/response'
import Avatar from '@/components/Avatar'
import { useAppState } from '@/states'
import { chineseTime } from '@/utils/dayjs'

import ConversationList from './ConversationList'

const Conversation = ({
  chatId,
  uid,
  initialList,
}: {
  chatId?: number
  uid?: number
  initialList?: ChatConversation[]
}) => {
  const { state } = useAppState()
  const [chatList, setChatList] = useState(initialList)
  const [isEnded, setEnded] = useState(false)
  const initQuery = () => ({
    chatId,
    uid,
    chatList: !chatList?.length,
  })
  const [query, setQuery] = useState<ChatMessagesRequest>(initQuery())
  const {
    data: currentData,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['chat', query],
    queryFn: () => getChatMessages(query),
    gcTime: 0,
  })
  useEffect(() => {
    if (currentData) {
      if (currentData.chat_list) {
        setChatList(currentData.chat_list)
      }
      if (currentData.rows.length > 0) {
        setData(currentData.rows.reverse().concat(data))
      }
      if (currentData.total <= currentData.page_size) {
        setEnded(true)
      }
    }
  }, [currentData])
  const [data, setData] = useState<ChatMessage[]>([])
  const { observe } = useInView({
    rootMargin: '50px 0px',
    onEnter: ({ unobserve }) => {
      unobserve()
      if (data.length) {
        setQuery({
          ...query,
          newer: false,
          dateline: data[0].dateline,
          messageId: data[0].message_id,
        })
      }
    },
  })
  const scrollContainer = createRef<HTMLUListElement>()
  const lastScrollHeight = useRef<number>()
  useLayoutEffect(() => {
    if (!scrollContainer.current) {
      return
    }
    if (query.page == 1) {
      scrollContainer.current.scrollTop = scrollContainer.current.scrollHeight
    } else {
      scrollContainer.current.scrollTop += Math.max(
        0,
        scrollContainer.current.scrollHeight - (lastScrollHeight.current || 0)
      )
    }
    lastScrollHeight.current = scrollContainer.current.scrollHeight
  }, [data])
  useEffect(() => {
    setData([])
    lastScrollHeight.current = 0
    setEnded(false)
    setQuery(initQuery())
  }, [chatId, uid])
  return (
    <Stack direction="row" maxHeight="calc(100vh - 200px)">
      <Box sx={{ width: 200 }} flexShrink={0} overflow="auto">
        <ConversationList
          list={chatList || []}
          lite={true}
          activeConversation={chatList?.find(
            (item) => item.conversation_id == chatId || item.to_uid == uid
          )}
        />
      </Box>
      <Stack flexGrow={1}>
        <List
          sx={{
            p: 1,
            overflow: 'auto',
            width: '100%',
            flexGrow: 1,
            flexShrink: 1,
          }}
          ref={scrollContainer}
        >
          {!isEnded && !(isFetching && query.page == 1) && (
            <ListItem
              key={`loading-older-${chatId}-${query.page}`}
              ref={isFetching ? undefined : observe}
              sx={{ justifyContent: 'center' }}
            >
              {isError ? (
                <Typography>加载失败</Typography>
              ) : (
                <Skeleton width="100%" height={40} />
              )}
            </ListItem>
          )}
          {data.map((item, index) => (
            <ListItem
              key={`${index}`}
              sx={{
                justifyContent:
                  item.author_id == state.user.uid ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              {item.author_id != state.user.uid && (
                <Avatar variant="rounded" uid={item.author_id} />
              )}
              <Stack mx={1} maxWidth="70%">
                <Typography
                  textAlign={
                    item.author_id == state.user.uid ? 'right' : 'left'
                  }
                  mb={0.5}
                >
                  {item.author}
                </Typography>
                <Paper elevation={3} sx={{ p: 1 }}>
                  <Typography sx={{ lineBreak: 'anywhere' }}>
                    {item.message}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    textAlign="right"
                    sx={{ color: '#999' }}
                  >
                    {chineseTime(item.dateline * 1000)}
                  </Typography>
                </Paper>
              </Stack>
              {item.author_id == state.user.uid && (
                <Avatar variant="rounded" uid={item.author_id} />
              )}
            </ListItem>
          ))}
        </List>
        <Divider />
        <Stack
          direction="row"
          flexGrow={0}
          flexShrink={0}
          p={1.5}
          alignItems="flex-end"
        >
          <TextField multiline rows={4} sx={{ flexGrow: 1, flexShrink: 1 }} />
          <IconButton sx={{ flexGrow: 0, flexShrink: 0, ml: 1, mb: 1 }}>
            <Send />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default Conversation
