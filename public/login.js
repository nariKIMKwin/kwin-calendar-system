document.getElementById("loginBtn").onclick = async () => {

    const id = document.getElementById("loginId").value;
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!id || !password) {

        alert("아이디와 비밀번호를 입력해주세요.");
        return;

    }

    try {

        const res = await fetch("/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                id,
                password,
                rememberMe
            })

        });

        const data = await res.json();

        if (data.success) {

            location.href = "/";

        } else {

            alert("아이디 또는 비밀번호가 틀렸습니다.");

        }

    } catch (err) {

        console.error(err);

        alert("로그인 중 오류가 발생했습니다.");

    }

};

document.getElementById("loginPassword")
.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        document.getElementById("loginBtn").click();

    }

});