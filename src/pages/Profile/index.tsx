import React, { useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Feather';
import ImagePicker from 'react-native-image-picker';

import api from '../../services/api';

import getValidationErrors from '../../utils/getValidationErrors';

import Input from '../../components/Input';
import Button from '../../components/Button';

import {
  Container,
  Title,
  UserAvatarButton,
  UserAvatar,
  BackButton,
} from './styles';
import { useAuth } from '../../hooks/auth';

interface ProfileFormData {
  name: string;
  email: string;
  password: string;
  old_password: string;
  password_confirmation: string;
}

const SignUp: React.FC = () => {
  const { user, updateUser } = useAuth();

  const formRef = useRef<FormHandles>(null);
  const navigation = useNavigation();

  const emailInputRef = useRef<TextInput>(null);
  const oldPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const handleSignUp = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: val => !!val.length,
            then: Yup.string().required('Campo obrigatório'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when('old_password', {
              is: val => !!val.length,
              then: Yup.string().required('Campo obrigatório'),
              otherwise: Yup.string(),
            })
            .oneOf([Yup.ref('password'), undefined], 'COnfirmação incorreta'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const {
          name,
          email,
          old_password,
          password,
          password_confirmation,
        } = data;

        const formData = {
          name,
          email,
          ...(data.old_password
            ? {
                old_password,
                password,
                password_confirmation,
              }
            : {}),
        };

        const response = await api.put('/profile', formData);

        updateUser(response.data);

        Alert.alert('Perfil atualizado com sucesso!');

        navigation.goBack();
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          if (err instanceof Yup.ValidationError) {
            const errors = getValidationErrors(err);

            formRef.current?.setErrors(errors);

            return;
          }

          Alert.alert(
            'Erro na atualização',
            'Ocorreu um erro ao atualizar o perfil, tente novamente',
          );
        }
      }
    },
    [navigation, updateUser],
  );

  const handleUpdateAvatar = useCallback(() => {
    ImagePicker.showImagePicker(
      {
        title: 'Selecione um avatar',
        cancelButtonTitle: 'Cancelar',
        takePhotoButtonTitle: 'Usar câmera',
        chooseFromLibraryButtonTitle: 'Escolher da galeria',
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.error) {
          Alert.alert('Erro ao atualizar seu avatar');
          return;
        }

        const data = new FormData();

        data.append('avatar', {
          type: 'image/jpeg',
          name: `${user.id}.jpg`,
          uri: response.uri,
        });

        api.patch('users/avatar', data).then(apiResponse => {
          updateUser(apiResponse.data);
        });
      },
    );
  }, [updateUser, user.id]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flex: 1 }}
        >
          <Container>
            <BackButton onPress={handleGoBack}>
              <Icon name="chevron-left" size={32} color="#999591" />
            </BackButton>

            <UserAvatarButton onPress={handleUpdateAvatar}>
              <UserAvatar
                source={{
                  uri:
                    'data:image/jpeg;base64,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',
                }}
              />
            </UserAvatarButton>

            <View>
              <Title>Meu perfil</Title>
            </View>

            <Form initialData={user} ref={formRef} onSubmit={handleSignUp}>
              <Input
                autoCapitalize="words"
                name="name"
                icon="mail"
                placeholder="Nome"
                returnKeyType="next"
                onSubmitEditing={() => {
                  emailInputRef.current?.focus();
                }}
              />
              <Input
                ref={emailInputRef}
                keyboardType="email-address"
                autoCorrect={false}
                autoCapitalize="none"
                name="email"
                icon="mail"
                placeholder="E-mail"
                returnKeyType="next"
                onSubmitEditing={() => {
                  oldPasswordInputRef.current?.focus();
                }}
              />
              <Input
                ref={oldPasswordInputRef}
                secureTextEntry
                name="old_password"
                icon="lock"
                placeholder="Senha atual"
                textContentType="newPassword"
                returnKeyType="next"
                containerStyle={{ marginTop: 16 }}
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
              />

              <Input
                ref={passwordInputRef}
                secureTextEntry
                name="password"
                icon="lock"
                placeholder="Nova senha"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => {
                  confirmPasswordInputRef.current?.focus();
                }}
              />

              <Input
                ref={confirmPasswordInputRef}
                secureTextEntry
                name="password_confirmation"
                icon="lock"
                placeholder="Confirmar senha"
                textContentType="newPassword"
                returnKeyType="send"
                onSubmitEditing={() => formRef.current?.submitForm()}
              />

              <Button onPress={() => formRef.current?.submitForm()}>
                Confirmar Mudanças
              </Button>
            </Form>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default SignUp;
