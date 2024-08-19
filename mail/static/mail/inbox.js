document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-form').onsubmit = () => {
    send_request();
    return false;
  }
}

function send_request(){
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => {
    clone = response.clone();
    if (response.status === 400 || response.status === 404){
      clone.json()
      .then(error => compose_error(error))
    }
    else{
      localStorage.clear();
      load_mailbox('sent');
    }
  })
}

function compose_error(error){
  console.log(error);
  const errorblock = document.querySelector('#compose-error');
  errorblock.replaceChildren();
  const element = document.createElement('div');
  element.classList.add("alert", "alert-danger");
  element.innerHTML = `${error.error}`;
  errorblock.append(element);
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => {
    clone = response.clone();
    if (response.status === 400 || response.status === 404){
      clone.json()
      .then(error => {
        console.log(error.error);
        const errorblock = document.querySelector('#emails-view');
        const element = document.createElement('div');
        element.classList.add("alert", "alert-danger");
        element.innerHTML = `${error.error}`;
        errorblock.append(element);
        document.body.scrollTop = document.documentElement.scrollTop = 0;
      })
    }
    else{
      clone.json()
      .then(emails => emails.forEach(email => {
        console.log(email);
        const element=document.createElement('div');
        if (email.read){
          element.className = "readbox";
        }
        else{
          element.className = "unreadbox";
        }
        element.innerHTML = `<div>${email.sender}</div> <div>${email.subject}</div> <div>${email.timestamp}</div>`;
        element.addEventListener('click', function(){
          openemail(email);
        });
        document.querySelector("#emails-view").append(element);
      }))
  }})
  localStorage.clear();
}

function openemail(email){
 
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  
  view = document.querySelector("#view-email");
  view.innerHTML =`<p> From: ${email.sender} </p>`;
  view.innerHTML +=`<p> To: ${email.recipients} </p>`;
  view.innerHTML +=`<p> Subject: ${email.subject} </p>`;
  view.innerHTML +=`<p> Time: ${email.timestamp} </p>`;

  bodyel=document.createElement('div');
  bodyel.className = "emailbody";
  bodyel.innerHTML = `<p>${email.body}</p>`;
  view.append(bodyel);

  replybtn=document.createElement('button');
  replybtn.className="emailbtn";

  replyimg=document.createElement('img');
  replyimg.src="https://cdn-icons-png.flaticon.com/512/747/747333.png";
  replyimg.width=14, replyimg.height=14;
    
  replybtn.append(replyimg);
  replybtn.innerHTML+="Reply";

  replybtn.addEventListener('click', function(){
    reply(email);
  })
  view.append(replybtn);

  archivebtn=document.createElement('button');
  archivebtn.className="emailbtn";
  if (email.archived){
    archivebtn.innerHTML="Unarchive";
  }
  else{
    archivebtn.innerHTML="Archive";
  }
  archivebtn.addEventListener('click', function(){
    archive(email);
  })
  view.append(archivebtn);
}


function archive(email){
  if (email.archived){
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
  }
  else{
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
  }
  load_mailbox('inbox');
  window.location.reload();
}

function reply(email){
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = `${email.sender}`;
    if (email.subject.includes("RE:")){
      document.querySelector('#compose-subject').value = `${email.subject}`;
    }
    else{
      document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
    }
    document.querySelector('#compose-recipients').disabled = true;
    document.querySelector('#compose-subject').disabled = true;

    document.querySelector('#compose-body').value = '\r\n'+'\r\n'+`>>On ${email.timestamp} ${email.sender} wrote:`+'\r\n'+`${email.body}`;
    document.querySelector('#compose-form').onsubmit = () => {
      send_request();
      return false;
    }
}
