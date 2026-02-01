// HTTP request get,get/id,post,put/id, soft-delete via isDeleted
async function getNextId(resource) {
    try {
        let res = await fetch(`http://localhost:3000/${resource}`);
        if (!res.ok) return '1';
        let items = await res.json();
        let max = 0;
        for (const it of items) {
            if (!it.id) continue;
            let n = parseInt(it.id + "", 10);
            if (!isNaN(n) && n > max) max = n;
        }
        return String(max + 1);
    } catch (e) {
        console.error(e);
        return '1';
    }
}

async function LoadData() {
    try {
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();
        let body = document.getElementById("table-body");
        body.innerHTML = "";
        for (const post of posts) {
            const title = post.isDeleted ? `<s>${post.title}</s>` : post.title;
            const btnLabel = post.isDeleted ? 'Restore' : 'Delete';
            body.innerHTML += `<tr>
                <td>${post.id}</td>
                <td>${title}</td>
                <td>${post.views}</td>
                <td>
                    <input type='submit' value='Edit' onclick='EditPost("${post.id}")' />
                    <input type='submit' value='${btnLabel}' onclick='ToggleDelete("${post.id}")'/>
                </td>
            </tr>`;
        }
        // load comments too
        LoadComments();
        return false;
    } catch (error) {
        console.log(error);
    }

}

async function Save() {
    let id = document.getElementById("id_txt").value.trim();
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("view_txt").value;

    if (!id) {
        // create new with auto id (string)
        id = await getNextId('posts');
        try {
            let res = await fetch('http://localhost:3000/posts', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id, title: title, views: views })
            });
            if (res.ok) console.log('them du lieu thanh cong');
        } catch (e) { console.error(e); }
    } else {
        // update existing: preserve isDeleted if exists
        try {
            let getItem = await fetch("http://localhost:3000/posts/" + id);
            if (getItem.ok) {
                let old = await getItem.json();
                let payload = { id: String(id), title: title, views: views };
                if (old.isDeleted) payload.isDeleted = true;
                let res = await fetch('http://localhost:3000/posts/' + id, {
                    method: 'PUT',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) console.log('edit du lieu thanh cong');
            } else {
                // not found -> create with provided id
                let res = await fetch('http://localhost:3000/posts', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: String(id), title: title, views: views })
                });
                if (res.ok) console.log('them du lieu thanh cong');
            }
        } catch (e) { console.error(e); }
    }

    // clear id field after saving
    document.getElementById("id_txt").value = '';
    LoadData();

}

async function EditPost(id) {
    try {
        let res = await fetch('http://localhost:3000/posts/' + id);
        if (!res.ok) return;
        let p = await res.json();
        document.getElementById('id_txt').value = p.id;
        document.getElementById('title_txt').value = p.title;
        document.getElementById('view_txt').value = p.views;
    } catch (e) { console.error(e); }
}

async function ToggleDelete(id) {
    try {
        // fetch item to know current isDeleted state
        let getItem = await fetch('http://localhost:3000/posts/' + id);
        if (!getItem.ok) return;
        let post = await getItem.json();
        let newVal = !post.isDeleted;
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: newVal })
        });
        if (res.ok) console.log(newVal ? 'soft-deleted' : 'restored');
        LoadData();
    } catch (e) { console.error(e); }
}

// -------------------- Comments CRUD --------------------
async function LoadComments() {
    try {
        let res = await fetch('http://localhost:3000/comments');
        let comments = await res.json();
        let body = document.getElementById('comment-body');
        body.innerHTML = '';
        for (const c of comments) {
            const text = c.isDeleted ? `<s>${c.text}</s>` : c.text;
            const btnLabel = c.isDeleted ? 'Restore' : 'Delete';
            body.innerHTML += `<tr>
                <td>${c.id}</td>
                <td>${text}</td>
                <td>${c.postId}</td>
                <td>
                    <input type='submit' value='edit' onclick='EditComment("${c.id}")' />
                    <input type='submit' value='${btnLabel}' onclick='ToggleDeleteComment("${c.id}")' />
                </td>
            </tr>`;
        }
    } catch (e) { console.error(e); }
}

async function SaveComment() {
    let id = document.getElementById('comment_id_txt').value.trim();
    let text = document.getElementById('comment_text_txt').value;
    let postId = document.getElementById('comment_postid_txt').value;
    if (!id) {
        id = await getNextId('comments');
        let res = await fetch('http://localhost:3000/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, text: text, postId: String(postId) })
        });
        if (res.ok) console.log('comment created');
    } else {
        // try to update
        try {
            let getItem = await fetch('http://localhost:3000/comments/' + id);
            if (getItem.ok) {
                let res = await fetch('http://localhost:3000/comments/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: String(id), text: text, postId: String(postId) })
                });
                if (res.ok) console.log('comment updated');
            } else {
                let res = await fetch('http://localhost:3000/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id, text: text, postId: String(postId) })
                });
                if (res.ok) console.log('comment created');
            }
        } catch (e) { console.error(e); }
    }
    // clear form
    document.getElementById('comment_id_txt').value = '';
    document.getElementById('comment_text_txt').value = '';
    document.getElementById('comment_postid_txt').value = '';
    LoadComments();
}

async function EditComment(id) {
    try {
        let res = await fetch('http://localhost:3000/comments/' + id);
        if (!res.ok) return;
        let c = await res.json();
        document.getElementById('comment_id_txt').value = c.id;
        document.getElementById('comment_text_txt').value = c.text;
        document.getElementById('comment_postid_txt').value = c.postId;
    } catch (e) { console.error(e); }
}

async function ToggleDeleteComment(id) {
    try {
        let getItem = await fetch('http://localhost:3000/comments/' + id);
        if (!getItem.ok) return;
        let comment = await getItem.json();
        let newVal = !comment.isDeleted;
        let res = await fetch('http://localhost:3000/comments/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: newVal })
        });
        if (res.ok) console.log(newVal ? 'comment soft-deleted' : 'comment restored');
        LoadComments();
    } catch (e) { console.error(e); }
}

LoadData();
