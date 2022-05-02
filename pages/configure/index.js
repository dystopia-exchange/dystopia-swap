import { withTheme } from "@mui/styles";
import classes from "./configure.module.css";
import { CircularProgress } from '@mui/material';

function ProjectIcon(props) {
  const { color, className, width, height } = props;
  return (
    <CircularProgress />
  );
}

function Configure({ theme }) {
  return (
    <div className={classes.configureContainer}>
      <ProjectIcon
        color={
          (theme?.palette.mode === "dark")
            ? "white"
            : "rgb(33, 37, 41)"
        }
        altColor={
          (theme?.palette.mode === "dark")
            ? "rgb(33, 37, 41)"
            : "white"
        }
        width="123px"
        height="42.3px"
        className={classes.logo}
      />
    </div>
  );
}

export default withTheme(Configure);
