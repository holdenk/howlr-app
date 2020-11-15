import React, { useCallback, useRef, useState } from 'react';
import { Input, Icon, Button, Divider } from '@ui-kitten/components';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { trim, isEmpty } from 'lodash';
import Constants from 'expo-constants';

import { GET_CHAT } from '../../hooks/useGetChat';
import useViewer from '../../hooks/useViewer';
import useAddMessage from '../../hooks/useAddMessage';
import useAcceptChat from '../../hooks/useAcceptChat';
import usePickImage from '../../hooks/usePickImage';

import showTransactionMessage from '../../utils/showTransactionMessage';

const ChatInput = ({
  chat,
  style
}) => {
  const { id: viewerId } = useViewer();

  const inputRef = useRef(null);

  const [ addMessage, { loading: addMessageLoading } ] = useAddMessage({
    awaitRefetchQueries: true,
    refetchQueries: [{ query: GET_CHAT, variables: { id: chat.id } }]
  });

  const [ body, setBody ] = useState("");

  const handleChangeText = useCallback((value) => {
    setBody(value)
  }, []);

  const handleSendMessage = useCallback(async () => {
    await addMessage({ variables: { input: { chatId: chat.id, body: trim(body) }}});
    inputRef.current?.clear();
    setBody("");
  }, [body]);

  const [ acceptChat, { loading: acceptChatLoading } ] = useAcceptChat();
  const handleAcceptChat = useCallback(() => {
    acceptChat({
      variables: {
        input: { chatId: chat.id }
      }
    })
  }, []);

  const pickImage = usePickImage();
  const handleAddImage = async () => {
    const { uri } = await pickImage({
      aspect: Constants.manifest.extra.picturesRatio,
      width: 1080,
    });

    if (uri) {
      showTransactionMessage({
        message: "Uploading picture"
      }, () => (
        addMessage({
          variables: {
            input: { chatId: chat.id, pictureUrl: uri }
          }
        })
      ));
    }
  }

  const renderAccessoryLeft = useCallback(({ style }) => {
    return (
      <TouchableOpacity
        onPress={handleAddImage}
        disabled={addMessageLoading}
        style={styles.accessory}
      >
        <Icon name="image-outline" style={style} />
      </TouchableOpacity>
    );
  }, [handleAddImage, addMessageLoading, body]);

  const renderAccessoryRight = useCallback(({ style }) => {
    const disabled = isEmpty(trim(body));

    return (
      <TouchableOpacity
        onPress={handleSendMessage}
        style={styles.accessory}
        disabled={addMessageLoading || disabled}
      >
        <Icon name="checkmark-circle-2" style={style} />
      </TouchableOpacity>
    );
  }, [addMessageLoading, handleSendMessage, body]);

  if (chat.contact.system) {
    return (
      <View
        style={style}
      >
        <Button
          disabled
          status="basic"
        >
          You cannot reply to this user
        </Button>
      </View>
    );
  }

  return (
    <>
      <Divider />
      <View
        style={style}
      >
        {
          chat.acceptedAt && (
            <Input
              ref={inputRef}
              disabled={addMessageLoading}
              onChangeText={handleChangeText}
              placeholder="Write your message..."
              accessoryLeft={renderAccessoryLeft}
              accessoryRight={renderAccessoryRight}
              multiline
            />
          )
        }
        {
          (!chat.acceptedAt && chat.senderId === viewerId) && (
            <Button
              disabled
              status="basic"
            >
              Waiting confirmation
            </Button>
          )
        }
        {
          (!chat.acceptedAt && chat.senderId !== viewerId) && (
            <Button
              status="success"
              disabled={acceptChatLoading}
              onPress={handleAcceptChat}
            >
              Accept
            </Button>
          )
        }
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  accessory: {
    alignSelf: 'flex-start'
  }
})

export default React.memo(ChatInput);