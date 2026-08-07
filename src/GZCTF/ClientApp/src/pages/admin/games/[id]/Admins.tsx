import { Avatar, Button, Center, Group, Paper, ScrollArea, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { mdiCheck, mdiClose, mdiDeleteOutline, mdiPlus } from '@mdi/js'
import { Icon } from '@mdi/react'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { ActionIconWithConfirm } from '@Components/ActionIconWithConfirm'
import { WithGameEditTab } from '@Components/admin/WithGameEditTab'
import { showErrorMsg } from '@Utils/Shared'
import api, { GameAdminInfoModel } from '@Api'
import tableClasses from '@Styles/Table.module.css'

const GameAdminManagement: FC = () => {
  const { id } = useParams()
  const numId = parseInt(id ?? '-1', 10)

  const { t } = useTranslation()
  const navigate = useNavigate()

  const [admins, setAdmins] = useState<GameAdminInfoModel[]>()
  const [userName, setUserName] = useInputState('')
  const [granting, setGranting] = useState(false)

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
  }, [numId])

  const fetchAdmins = async () => {
    try {
      const res = await api.edit.editGetGameAdmins(numId)
      setAdmins(res.data)
    } catch (e) {
      showErrorMsg(e, t)
    }
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

  const isLoading = admins === undefined

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
        <ScrollArea offsetScrollbars h="calc(100vh - 220px)">
          {admins && admins.length === 0 ? (
            <Center h="calc(100vh - 240px)">
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
    </WithGameEditTab>
  )
}

export default GameAdminManagement
