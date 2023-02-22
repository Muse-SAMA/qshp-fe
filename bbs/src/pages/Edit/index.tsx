import React from 'react'
import { Box, Input, Typography } from '@mui/material'

import Editor from '@/components/Editor'

const Edit = () => {
  return (
    <Box className="flex-1 flex relative flex-col">
      <Typography variant="h4" color="inherit">
        发布主题
      </Typography>
      <Box className="p-4">
        <Input placeholder="主题标题"></Input>
        <Editor />
      </Box>
    </Box>
  )
}

export default Edit