const username = "bagusdeployvercel"; // Ganti kalau username lu beda
const repo = "hxhdbebbsvsve";
const token = "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"; // Ganti sama token GitHub lu
const branch = "main";

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const resultBox = document.getElementById("result");

  if (!file) return alert("Pilih file dulu bro!");

  const reader = new FileReader();
  reader.onloadend = async () => {
    const content = reader.result.split(',')[1]; // base64

    const ext = file.name.split('.').pop();
    const randomId = Math.random().toString(36).substring(2, 7);
    const fileName = `${randomId}.${ext}`;
    const path = `file/${fileName}`;

    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
    
    const body = {
      message: `upload ${fileName}`,
      content: content,
      branch: branch
    };

    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      const fileUrl = `https://${username}.github.io/file/${fileName}`;
      resultBox.classList.remove("hidden");
      resultBox.innerHTML = `
        <p class="text-green-600 font-semibold">Upload berhasil!</p>
        <a href="${fileUrl}" target="_blank" class="text-blue-600 underline">${fileUrl}</a>
      `;
    } else {
      resultBox.classList.remove("hidden");
      resultBox.innerHTML = `
        <p class="text-red-600 font-semibold">Upload gagal: ${data.message}</p>
      `;
    }
  };

  reader.readAsDataURL(file);
});
