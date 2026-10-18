document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const interest = document.getElementById('interest').value;
    const messageDiv = document.getElementById('formMessage');

    messageDiv.style.color = '#4caf50';
    messageDiv.textContent = 'Köszönjük a regisztrációt, ' + name + '! Sikeresen feliratkoztál a hírlevelünkre (' + email + ', érdeklődési kör: ' + interest + ').';

    this.reset();
});

// Option card selection styling
function updateOptionCards() {
    document.querySelectorAll('.option-card').forEach(card => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio.checked) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', function() {
        const radio = this.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = true;
            updateOptionCards();
        }
    });
});

document.getElementById('subscriptionForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('subEmail').value;
    const name = document.getElementById('subName').value;
    const duration = document.querySelector('input[name="duration"]:checked').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const messageDiv = document.getElementById('subMessage');

    let durationText = '';
    switch(duration) {
        case '1nap': durationText = '1 napos (490 Ft)'; break;
        case '1honomap': durationText = '1 hónapos (2 990 Ft)'; break;
        case '1ev': durationText = '1 éves (29 990 Ft)'; break;
    }

    let paymentText = '';
    switch(payment) {
        case 'googlepay': paymentText = 'Google Pay'; break;
        case 'applepay': paymentText = 'Apple Pay'; break;
        case 'kartya': paymentText = 'Bankkártya'; break;
    }

    messageDiv.style.color = '#4caf50';
    messageDiv.innerHTML = 'Köszönjük, ' + name + '! Sikeresen feliratkoztál a hírlevelünkre (' + email + ').<br>Csomag: ' + durationText + '<br>Fizetés: ' + paymentText;

    this.reset();
});