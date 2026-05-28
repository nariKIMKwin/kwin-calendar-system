document.getElementById("loginBtn").onclick = async () => {

    const id = document.getElementById("loginId").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id,
            password
        })
    });

    const data = await res.json();

    if (data.success) {
        location.href = "/";
    } else {
        alert("아이디 또는 비밀번호가 틀렸습니다.");
    }

};