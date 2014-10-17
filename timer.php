<?php

    function clean_data($input) {
        $input = trim(htmlentities(strip_tags($input,",")));
        if (get_magic_quotes_gpc())
            $input = stripslashes($input);
        return $input;
    }

    if ( isset($_REQUEST["label"]) && isset($_REQUEST["duration"]) && isset($_REQUEST["page"])) {

        $label = clean_data($_REQUEST["label"]);
        $duration = clean_data($_REQUEST["duration"]);
        $page = clean_data($_REQUEST["page"]);
        $time = new DateTime();
        $ip_remote_addr = $_SERVER['REMOTE_ADDR'];
        $ip_http_x_forwarded_for = $_SERVER['HTTP_X_FORWARDED_FOR'];
        $ip_http_client_ip = $_SERVER['HTTP_CLIENT_IP'];

		$csvStr =  $label . "," . $duration . "," . $page . "," . $time->format('Y-m-d H:i:s') .  "," . $ip_remote_addr . "," . $ip_http_x_forwarded_for . "," . $ip_http_client_ip;
		$sqlStr =  $label . "','" . $duration . "','" . $page . "','" . $time->format('Y-m-d H:i:s') .  "','" . $ip_remote_addr . "','" . $ip_http_x_forwarded_for . "','" . $ip_http_client_ip;

		$file = "/tmp/timer-" . $ip_remote_addr . "-" . $time->format('Y-m-d H') . ".log";
        $link = mysqli_connect("localhost", "user", "password", "timer");

        if (mysqli_connect_errno()) {
			printf("\nConnect failed: %s\n", mysqli_connect_error(), "\n trying to log to file");
			file_put_contents($file, $csvStr . "\n", FILE_APPEND | LOCK_EX);
        } else {
			if (
				mysqli_query(
						$link, "INSERT INTO tests "
						.  "(label, duration, page, time, ip_remote_addr, ip_http_x_forwarded_for, ip_http_client_ip) VALUES"

						. " ('"
								. $timeStr
						. "')"

				) === TRUE) {
					printf("\nlabel: " . $label . " successfully added\n");
			} else {
				  printf("\nlabel: " . $label . " not added to DB something went wrong. \n");
			}
			mysqli_close($link);
        }
    }
?>