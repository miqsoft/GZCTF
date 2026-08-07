import { Avatar, Button, Center, Group, Paper, ScrollArea, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { mdiCheck, mdiClose, mdiDeleteOutline, mdiPlus } from '@mdi/js'
import { Icon } from '@mdi/react'
import dayjs from 'dayjs'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { ActionIconWithConfirm } from '@Components/ActionIconWithConfirm'
import { WithGameEditTab } from '@Components/admin/WithGameEditTab'
import { showErrorMsg } from '@Utils/Shared'
import api, { GameAdminInfoModel, RegistrationCodeInfoModel } from '@Api'
import tableClasses from '@Styles/Table.module.css'

const GameAdminManagement: FC = () => {
  const { id } = useParams()
  const numId = parseInt(id ?? '-1', 10)

  const { t } = useTranslation()
  const navigate = useNavigate()

  const [admins, setAdmins] = useState<GameAdminInfoModel[]>()
  const [userName, setUserName] = useInputState('')
  const [granting, setGranting] = useState(false)

  const [codes, setCodes] = useState<RegistrationCodeInfoModel[]>()
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (Number.isNaN(numId) || numId < 0) {
      showNotification({
        color: 'red',
        message: t('common.error.param_error'),
        icon: <Icon path={mdiClose} size={1} />,
      })
      navigate('/admin/games')
      return
    }

    fetchAdmins()
    fetchCodes()
  }, [numId])

  const fetchAdmins = async () => {
    try {
      const res = await api.edit.editGetGameAdmins(numId)
      setAdmins(res.data)
    } catch (e) {
      showErrorMsg(e, t)
    }
  }

  const fetchCodes = async () => {
    try {
      const res = await api.edit.editGetRegistrationCodes(numId)
      setCodes(res.data)
    } catch (e) {
      showErrorMsg(e, t)
    }
  }

  const onGenerateCode = async () => {
    setGenerating(true)

    try {
      const res = await api.edit.editCreateRegistrationCode(numId)
      setCodes((prev) => [res.data, ...(prev ?? [])])
      showNotification({
        color: 'teal',
        message: t('admin.notification.games.registration_codes.generated'),
        icon: <Icon path={mdiCheck} size={1} />,
      })
    } catch (e) {
      showErrorMsg(e, t)
    } finally {
      setGenerating(false)
    }
  }

  const onRevokeCode = async (code: RegistrationCodeInfoModel) => {
    if (!code.code) return
    await api.edit.editRevokeRegistrationCode(numId, code.code)
    setCodes((prev) => (prev ?? []).filter((c) => c.code !== code.code))
    showNotification({
      color: 'teal',
      message: t('admin.notification.games.registration_codes.revoked'),
      icon: <Icon path={mdiCheck} size={1} />,
    })
  }

  const onGrant = async () => {
    if (!userName) return
    setGranting(true)

    try {
      const lookup = await api.edit.editLookupUserByName(numId, userName)
      await api.edit.editGrantGameAdmin(numId, lookup.data.id!)
      setAdmins((prev) => [...(prev ?? []).filter((a) => a.id !== lookup.data.id), lookup.data])
      setUserName('')
      showNotification({
        color: 'teal',
        message: t('admin.notification.games.admins.granted'),
        icon: <Icon path={mdiCheck} size={1} />,
      })
    } catch (e) {
      showErrorMsg(e, t)
    } finally {
      setGranting(false)
    }
  }

  const onRevoke = async (admin: GameAdminInfoModel) => {
    await api.edit.editRevokeGameAdmin(numId, admin.id!)
    setAdmins((prev) => (prev ?? []).filter((a) => a.id !== admin.id))
    showNotification({
      color: 'teal',
      message: t('admin.notification.games.admins.revoked'),
      icon: <Icon path={mdiCheck} size={1} />,
    })
  }

  const isLoading = admins === undefined || codes === undefined

  return (
    <WithGameEditTab
      allowManager
      isLoading={isLoading}
      contentPos="right"
      head={
        <Group wrap="nowrap" gap="xs">
          <TextInput
            placeholder={t('admin.content.games.admins.username_placeholder')}
            value={userName}
            onChange={setUserName}
            onKeyDown={(e) => {
              if (!granting && e.key === 'Enter') onGrant()
            }}
          />
          <Button leftSection={<Icon path={mdiPlus} size={1} />} loading={granting} onClick={onGrant}>
            {t('admin.button.games.admins.grant')}
          </Button>
        </Group>
      }
    >
      <Paper shadow="md" p="md" w="100%">
        <ScrollArea offsetScrollbars h="calc(50vh - 130px)">
          {admins && admins.length === 0 ? (
            <Center h="calc(50vh - 150px)">
              <Stack gap={0} align="center">
                <Title order={2}>{t('admin.content.games.admins.empty.title')}</Title>
                <Text>{t('admin.content.games.admins.empty.description')}</Text>
              </Stack>
            </Center>
          ) : (
            <Table className={tableClasses.table}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('common.label.user')}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {admins?.map((admin) => (
                  <Table.Tr key={admin.id}>
                    <Table.Td>
                      <Group wrap="nowrap" gap="xs">
                        <Avatar alt="avatar" radius="xl">
                          {admin.userName?.slice(0, 1) ?? 'U'}
                        </Avatar>
                        <Text ff="monospace" size="sm" fw="bold">
                          {admin.userName}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td align="right">
                      <ActionIconWithConfirm
                        iconPath={mdiDeleteOutline}
                        color="alert"
                        message={t('admin.content.games.admins.revoke_confirm', { name: admin.userName })}
                        onClick={() => onRevoke(admin)}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Paper>
      <Paper shadow="md" p="md" w="100%">
        <Group justify="space-between" mb="sm">
          <Title order={4}>{t('admin.content.games.registration_codes.title')}</Title>
          <Button leftSection={<Icon path={mdiPlus} size={1} />} loading={generating} onClick={onGenerateCode}>
            {t('admin.button.games.registration_codes.generate')}
          </Button>
        </Group>
        {codes && codes.length === 0 ? (
          <Center h="15vh">
            <Stack gap={0} align="center">
              <Title order={2}>{t('admin.content.games.registration_codes.empty.title')}</Title>
              <Text>{t('admin.content.games.registration_codes.empty.description')}</Text>
            </Stack>
          </Center>
        ) : (
          <Table className={tableClasses.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.label.code')}</Table.Th>
                <Table.Th>{t('admin.content.games.registration_codes.created_at')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {codes?.map((code) => (
                <Table.Tr key={code.code}>
                  <Table.Td>
                    <Text ff="monospace" size="sm" fw="bold">
                      {code.code}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{dayjs(code.createdAtUtc).format('YYYY-MM-DD HH:mm')}</Text>
                  </Table.Td>
                  <Table.Td align="right">
                    <ActionIconWithConfirm
                      iconPath={mdiDeleteOutline}
                      color="alert"
                      message={t('admin.content.games.registration_codes.revoke_confirm', { code: code.code })}
                      onClick={() => onRevokeCode(code)}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </WithGameEditTab>
  )
}

export default GameAdminManagement
