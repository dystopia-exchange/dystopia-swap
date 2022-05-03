import { withTheme } from "@mui/styles";
import { CircularProgress } from '@mui/material';

function Configure({theme}) {
  return (
    <CircularProgress style={{display: 'none'}}/>
  );
}

export default withTheme(Configure);
