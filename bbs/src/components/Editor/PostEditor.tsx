import Vditor from 'vditor'

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Alert,
  Box,
  Button,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'

import { postThread, replyThreads } from '@/apis/thread'
import { ForumDetails, PostFloor } from '@/common/interfaces/response'
import Editor from '@/components/Editor'
import PostNotice from '@/components/Editor/PostNotice'
import { useSnackbar } from '@/components/Snackbar'
import { useAppState } from '@/states'
import { pages } from '@/utils/routes'

import Avatar from '../Avatar'
import Link from '../Link'
import { ThreadPostHeader } from './PostHeader'
import PostOptions from './PostOptions'
import ReplyQuote from './ReplyQuote'
import { PostEditorValue } from './types'

export type PostEditorKind = 'newthread' | 'reply'

const Author = ({
  small,
  anonymous,
}: {
  small?: boolean
  anonymous: boolean
}) => {
  const { state } = useAppState()
  const size = small ? 32 : 96
  return (
    <Stack direction={small ? 'row' : 'column'} alignItems="center" mr={2}>
      <Avatar
        uid={anonymous ? 0 : state.user.uid}
        sx={{ width: size, height: size, mr: small ? 1 : undefined }}
        variant="rounded"
      />
      <Typography mt={small ? undefined : 1} textAlign="center">
        {anonymous ? (
          '匿名'
        ) : (
          <Link underline="hover">{state.user.username}</Link>
        )}
      </Typography>
    </Stack>
  )
}

const PostEditor = ({
  forum,
  forumLoading,
  kind,
  threadId,
  postId,
  replyPost,
  onReplied,
  smallAuthor,
}: {
  forum?: ForumDetails
  forumLoading?: boolean
  kind?: PostEditorKind
  threadId?: number
  postId?: number
  replyPost?: PostFloor
  onReplied?: () => void
  smallAuthor?: boolean
}) => {
  kind = kind || 'newthread'
  if (kind == 'reply' && !threadId) {
    return <></>
  }

  const navigate = useNavigate()
  const buttonText = kind == 'newthread' ? '发布主题' : '发表回复'
  const [vd, setVd] = useState<Vditor>() // editor ref

  const {
    props: snackbarProps,
    message: snackbarMessage,
    show: showError,
  } = useSnackbar()
  const postThreadRef = useRef<PostEditorValue>({})
  const [postPending, setPostPending] = useState(false)
  const [anonymous, setAnonymous] = useState(
    !!postThreadRef.current.is_anonymous
  )

  const validateBeforeNewThread = () => {
    if (!postThreadRef.current.forum_id) {
      showError('请选择合适的版块。')
      return false
    }
    if (
      forum?.thread_types?.length &&
      !forum?.optional_thread_type &&
      !postThreadRef.current.type_id
    ) {
      showError('请选择合适的分类。')
      return false
    }
    if (!postThreadRef.current?.subject) {
      showError('请输入标题。')
      return false
    }

    return true
  }

  useEffect(() => {
    postThreadRef.current.forum_id = forum?.fid
  }, [forum?.fid])

  const handleError = () => {
    setPostPending(false)
  }

  const handleSubmit = async () => {
    if (postPending) {
      return
    }

    if (kind == 'newthread' && !validateBeforeNewThread()) {
      return
    }

    const message = vd?.getValue() || ''
    if (!message.trim()) {
      showError('请输入内容。')
      return
    }

    setPostPending(true)
    if (kind == 'newthread') {
      postThread({
        ...postThreadRef.current,
        // |forum_id| must not be undefined because it is already validated.
        forum_id: postThreadRef.current.forum_id as number,
        message,
        format: 2,
      })
        .then((result) => {
          vd?.setValue('')
          navigate(pages.thread(result.thread_id))
        })
        .catch(handleError)
    } else if (kind == 'reply' && threadId) {
      replyThreads({
        thread_id: threadId,
        post_id: postId,
        message: (postThreadRef.current.quoteMessagePrepend || '') + message,
        format: 2,
        is_anonymous: postThreadRef.current.is_anonymous,
      })
        .then(() => {
          vd?.setValue('')
          setPostPending(false)
          onReplied && onReplied()
        })
        .catch(handleError)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key == 'Enter') {
      handleSubmit()
    }
  }

  const handleOptionsChange = () => {
    setAnonymous(!!postThreadRef.current.is_anonymous)
  }

  return (
    <>
      {forumLoading ? (
        <Skeleton height={53} />
      ) : (
        <PostNotice forum={forum} position={kind} />
      )}
      <Stack direction="row">
        {!smallAuthor && <Author anonymous={anonymous} />}
        <Box flexGrow={1}>
          <ThreadPostHeader
            kind={kind}
            selectedForum={forum}
            valueRef={postThreadRef}
          />
          {replyPost && replyPost.position > 1 && (
            <ReplyQuote post={replyPost} valueRef={postThreadRef} />
          )}
          <Editor minHeight={300} setVd={setVd} onKeyDown={handleKeyDown} />
          <PostOptions
            forum={forum}
            valueRef={postThreadRef}
            onChanged={handleOptionsChange}
          />
        </Box>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={smallAuthor ? 'flex-end' : 'center'}
        mt={1.5}
      >
        {smallAuthor && <Author small anonymous={anonymous} />}
        <Button
          variant="contained"
          disabled={postPending}
          onClick={handleSubmit}
        >
          {postPending ? '请稍候...' : buttonText}
        </Button>
      </Stack>
      <Snackbar
        {...snackbarProps}
        autoHideDuration={5000}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        style={{ position: 'absolute', bottom: '60px' }}
      >
        <Alert severity="error">{snackbarMessage}</Alert>
      </Snackbar>
    </>
  )
}

export default PostEditor
