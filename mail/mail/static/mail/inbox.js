document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Prevent form from being submitted
  document.querySelector("form").onsubmit = () => {
    return false;
  }

  // ID of submit granted to the input form 'submit' in inbox.html
  document.querySelector("#submit").addEventListener('click', submit_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

//Reply to a particular email
function reply_email(data) {
  compose_email();
  setTimeout(function() {
    document.querySelector('#compose-recipients').value = data.sender;

    let reply_text = data.subject;
    let replied_flag = reply_text.startsWith("RE: ");
    if (replied_flag === true ) {
      document.querySelector('#compose-subject').value = reply_text;
    } else {
      document.querySelector('#compose-subject').value = `RE: ${reply_text}`;
    }
    
    document.querySelector('#compose-body').value = `\n\nOn ${data.timestamp} ${data.sender} wrote:\n${data.body}`;
    document.querySelector('#compose-body').setSelectionRange(0, 0);
    document.querySelector('#compose-body').focus();
  }, 100);
}

//Load a particular email
function load_email(mailbox, id) {
  console.log(mailbox);

  // Show single mail view and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-mail-view').style.display = 'block';

  // Clear existing content in the div while maintaining button
  document.querySelector('#single-mail-view').innerHTML = '';
  
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(result => {
    console.log(result);

    // Create the mail body
    var mail_body = document.createElement("div");
    mail_body.innerHTML = `<hr><p><b>From:</b> ${result.sender}</p><p><b>To:</b> ${result.recipients}</p><p><b>Subject:</b> ${result.subject}</p>
    <p><b>Timestamp: </b>${result.timestamp}</p><hr><plaintext>${result.body}`;

    // Create a button to archive or unarchive mails and add it to the body
    if (mailbox === 'sent') {
    } else {
      var archive_button = document.createElement("button");
      if (result.archived === false) {
        archive_button.innerHTML = "Archive Mail";
        archive_button.addEventListener("click", function() {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: true
          })
        })

        // Setting up this timeout to ensure archived is set to true before inbox is loaded
        setTimeout(function() {
          load_mailbox('inbox');
        }, 100);
        
      })
      } else {
        archive_button.innerHTML = "Unarchive Mail";
        archive_button.addEventListener("click", function() {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })

          // Setting up this timeout to ensure archived is set to false before inbox is loaded
          setTimeout(function() {
            load_mailbox('inbox');
          }, 100);

        })
      }
      document.querySelector('#single-mail-view').append(archive_button);
    }
    

    // Create a button to Reply to the mail
    var button_reply = document.createElement("button");
    button_reply.innerHTML = 'Reply';
    button_reply.addEventListener('click', function() {
      reply_email(result);
    })
    

    // Display the button to archive mails first and then the mail contents
    
    document.querySelector('#single-mail-view').append(mail_body);
    document.querySelector('#single-mail-view').append(button_reply);
    
  })

  // Change read status to true
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read:true
    })
  })
}

//Print emails to the screen
function print_email(mailbox, emails) {
  for (let i = 0; i < (emails.length); i++) {
    var mail_overview = document.createElement("div");
    mail_overview.classList.add('border');
    mail_overview.classList.add('border-dark');
    if (emails[i].read === true) {
      mail_overview.classList.add('bg-secondary');
    } else if (emails[i].read === false) {
      mail_overview.classList.remove('bg-secondary.bg-gradient')
    }
    //WARNING: The mail_overview.innerHTML below uses blank characters to ensure formatting - be careful while editing or remove completely the below completely
    if (mailbox === 'sent'){
      mail_overview.innerHTML = `<b>${emails[i].recipients}</b> ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀ <b>Subject:</b> ${emails[i].subject} 
      ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀ ${emails[i].timestamp}`; 
    } else {
      mail_overview.innerHTML = `<b>${emails[i].sender}</b> ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀ <b>Subject:</b> ${emails[i].subject} 
      ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀ ${emails[i].timestamp}`;
    }
    mail_overview.addEventListener("click", () => load_email(mailbox, emails[i].id))
    document.querySelector("#emails-view").append(mail_overview);
  }
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    //Print emails to console
    console.log(emails);

    //For each email print on screen using the print email function
    print_email(mailbox, emails);
  })
}

function submit_mail() {
  // Submit the mail
  fetch("/emails", {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    //Print result
    console.log(result);

    //Load the sent mailbox
    load_mailbox('sent');
  })
}