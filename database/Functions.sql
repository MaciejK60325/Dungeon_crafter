

DELIMITER $$
CREATE OR REPLACE FUNCTION Encode_password(pass VARCHAR(63)) RETURNS VARCHAR(63)
BEGIN
	DECLARE encoded_pass VARCHAR(63);
    SET encoded_pass = CONCAT(pass, "fishtank");
    RETURN encoded_pass;
END$$
DELIMITER ;

DELIMITER $$
CREATE OR REPLACE FUNCTION Decode_password(pass VARCHAR(63)) RETURNS VARCHAR(63)
BEGIN
    DECLARE decoded_pass VARCHAR(63);
    SET   decoded_pass = IF(pass LIKE "%fishtank", REPLACE(pass, "fishtank", ''), pass);
    RETURN decoded_pass;
    
END $$
DELIMITER ;


DELIMITER $$
CREATE OR REPLACE PROCEDURE Add_user(
    loginN VARCHAR(63),
    mail VARCHAR(63),
    pass VARCHAR(63)
)
BEGIN
	SET @p0=`Encode_password`(pass);
	INSERT INTO users (username, mail, pass) VALUES(
        loginN,
        mail,
        @p0
	);
END $$
DELIMITER ;