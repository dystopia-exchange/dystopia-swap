import React, { useState } from 'react';
import classes from './backButton.module.css';
import {useRouter} from "next/router";

function BackButton(props) {
    const router = useRouter();
    const { text, url } = props
    const [clicked, setClicked] = useState()

    const onBack = () => {
        setClicked(true)
        router.push(url);
    }

    return (
        <div
            className={`${classes.root} ${clicked ? classes.pushed : ''}`}
            onClick={onBack}
            tabindex="10"
        >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.49 0 0 4.49 0 10C0 15.51 4.49 20 10 20C15.51 20 20 15.51 20 10C20 4.49 15.51 0 10 0ZM11.79 13C12.08 13.29 12.08 13.77 11.79 14.06C11.64 14.21 11.45 14.28 11.26 14.28C11.07 14.28 10.88 14.21 10.73 14.06L7.2 10.53C6.91 10.24 6.91 9.76 7.2 9.47L10.73 5.94C11.02 5.65 11.5 5.65 11.79 5.94C12.08 6.23 12.08 6.71 11.79 7L8.79 10L11.79 13Z" fill="#E4E9F4"/>
            </svg>
            <span className={classes.text}>
              {text}
            </span>
        </div>
    )
}

export default BackButton