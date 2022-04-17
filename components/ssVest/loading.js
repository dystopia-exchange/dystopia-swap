import { Paper, Skeleton } from '@mui/material';
import classes from "./ssVest.module.css";

export default function loading() {
  return (
    <Paper elevation={0} className={ classes.container }>
      <Skeleton className={ classes.loadingSkeleton }/>
    </Paper>
  );
}
