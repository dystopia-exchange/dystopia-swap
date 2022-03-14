import { Paper } from '@mui/material';
import Skeleton from '@mui/lab/Skeleton';
import classes from "./ssVest.module.css";

export default function loading() {
  return (
    <Paper elevation={0} className={ classes.container }>
      <Skeleton className={ classes.loadingSkeleton }/>
    </Paper>
  );
}
