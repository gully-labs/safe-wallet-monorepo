import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { Box, Button, Link, Stack, SvgIcon, Typography } from '@mui/material'
import FiatIcon from '@/public/images/common/fiat2.svg'
import CopyTooltip from '@/components/common/CopyTooltip'
import CopyIcon from '@/public/images/common/copy.svg'
import { addFundsCopyFor } from '@/config/gully'
import { useGullyNoNativeValue } from '@/hooks/useGullyNoNativeValue'

const AddFundsToGetStarted = () => {
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const settings = useAppSelector(selectSettings)
  const chain = useCurrentChain()
  const { noNativeValue } = useGullyNoNativeValue()

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  if (!safe.deployed) return null

  // Gully Multisig: the copy follows the chain of the open Safe (config/gully.ts, addFundsCopyFor)
  const copy = addFundsCopyFor(chain, noNativeValue)

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'border.light' }}
      p={2}
      gap={2}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      borderRadius={1}
    >
      <Box
        width="40px"
        height="40px"
        bgcolor="background.default"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="6px"
        flexShrink="0"
      >
        <SvgIcon component={FiatIcon} inheritViewBox fontSize="small" />
      </Box>
      <Box>
        <Typography fontWeight="bold" color="text.primary">
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" data-testid="add-funds-copy">
          {copy.text}
          {copy.links.map((link) => (
            <span key={link.href}>
              {' '}
              <Link href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </Link>
            </span>
          ))}
        </Typography>
      </Box>
      <Box ml={{ xs: 0, md: 'auto' }}>
        <CopyTooltip text={addressCopyText}>
          <Button
            variant="outlined"
            sx={{ whiteSpace: 'nowrap' }}
            startIcon={<SvgIcon component={CopyIcon} inheritViewBox fontSize="small" />}
            size="small"
            disableElevation
          >
            Copy address
          </Button>
        </CopyTooltip>
      </Box>
    </Stack>
  )
}

export default AddFundsToGetStarted
