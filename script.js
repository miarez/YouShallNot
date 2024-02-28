$(document).ready(function() {
    const seedKey = 'passwordManagerSeed';
    let characterSequence = localStorage.getItem(seedKey) || generateAndStoreSequence(seedKey);

    function generateAndStoreSequence(key)
    {
        const seed = prompt('Enter a seed for generating passwords:');
        const sequence = generateSequenceFromSeed(seed, 10000); // Implement this based on your requirements
        localStorage.setItem(key, sequence);
        return sequence;
    }

    function clearLocal() {
        console.log("HERE");
        localStorage.clear();
        location.reload();
    }


    function generateSequenceFromSeed(seed, length) {
        // Improved hash function to handle longer seeds more effectively
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer by forcing overflow
        }

        // Linear Congruential Generator (LCG) parameters
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32; // Use 2^32 to ensure operations stay within JavaScript's integer precision
        let rand = Math.abs(hash); // Use the absolute value to avoid negative numbers

        // Seeded pseudo-random number generator
        function lcg() {
            rand = (a * rand + c) % m;
            return rand / m;
        }

        // Generate the sequence
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let sequence = '';
        for (let i = 0; i < length; i++) {
            sequence += characters.charAt(Math.floor(lcg() * characters.length));
        }

        return sequence;
    }



    $(".keypad").keypad(retrievePassword);

    function retrievePassword(offset) {
        offset = parseInt(offset, 10);
        const password = characterSequence.substring(offset, offset + 16);
        $('#passwordOutput').val(password);
    }

    function copyToClipboard() {
        const passwordOutput = document.getElementById('passwordOutput').value;

        // Create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.value = passwordOutput;

        document.body.appendChild(textarea);

        // Select the text
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices

        try {
            // Copy the text
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            console.log(`Password copy was ${msg}`);
        } catch (err) {
            console.error('Failed to copy password', err);
        }

        // Cleanup
        document.body.removeChild(textarea);
    }

    window.copyToClipboard = copyToClipboard;
    window.clearLocal = clearLocal;
});

// The keypad plugin initialization and other necessary scripts go here

;(function($){
    $.fn.keypad = function(confirmPin, options){
        var globalSettings = $.extend({}, $.fn.keypad.defaults, options);
        var keypads = $();
        this.each(function()
        {
            let $element = $(this),
                $backspace,
                $enteredNumbers,
                $numbers,
                $confirm,
                STATE = {mouseDownTime: 0, enteredPin: '' },
                backSpaceInterval = null,
                addToEnteredNumbers,
                backspaceOnPin,
                clearPin,
                settings = $.extend({}, globalSettings, $element.data('keypad-options'));

            addToEnteredNumbers = function(e){
                var num = $('<div class="num">'),
                    numVal = isNaN(e) ? $(this).data("num") : e;
                num.text(numVal);
                $enteredNumbers.append(num);
                STATE.enteredPin += numVal;
                setTimeout(() => num.addClass('hidden'), 500);
            }

            backspaceOnPin = function(e){
                const $toBeRemoved = $enteredNumbers.children().last();
                $toBeRemoved.addClass('erased');
                setTimeout(() => {
                    $toBeRemoved.remove();
                    if (STATE.enteredPin.length >= 1) STATE.enteredPin = STATE.enteredPin.slice(0, -1);
                }, 100);
            }

            clearPin = function(e){
                $enteredNumbers.empty();
                STATE.enteredPin = '';
            }

            $element.addClass("keypad").attr("tabindex", 0);
            $element.append(`<div class="keypad-input-field">
    <div class="entered-numbers-wrapper">
      <div class="entered-numbers"></div>
    </div>
    <div class="backspace">
      <div class="hover-dot backspace-icon"><i class="fa fa-times"></i></div>
    </div>
  </div>
  <div class="keypad-numbers"></div>
      `);

            $element.on('focus', function(){
                $element.addClass("focus");
            });
            $element.on('blur', function(){
                $element.removeClass("focus");
            });

            $backspace = $element.find(".backspace")
                .on("mousedown", function() {
                    STATE.mouseDownTime = moment().valueOf();
                    backSpaceInterval = setInterval(() => {
                        const timeDiff = moment().valueOf() - STATE.mouseDownTime;
                        if (timeDiff >= 1000) clearPin();
                    }, 100);
                })
                .on("mouseup", function() {
                    const timeDiff = moment().valueOf() - STATE.mouseDownTime;
                    clearInterval(backSpaceInterval);
                    if (timeDiff < 1000) {
                        backspaceOnPin();
                    }
                })
                .on("mouseleave", function() {
                    clearInterval(backSpaceInterval);
                });

            $enteredNumbers = $element.find(".entered-numbers");
            $numbers = $element.find(".keypad-numbers");

            $.each(settings.keys, function(index, item){
                var $key = $(`<div class="item-wrapper hover-dot">
      <div class="item">
        <h1>${item.num}</h1>
        <h2>${item.alpha}</h2>
      </div>
    </div>`)
                if(item.num == 0){
                    $key.addClass("zero")
                }
                $key.data("num", item.num)
                $key.on('click', addToEnteredNumbers);
                $numbers.append($key);
            })

            $confirm = $(`<div class="item-wrapper hover-dot" class="confirm">
      <div class="item"><i class="fa fa-check"></i></div>
    </div>`);
            $confirm.on('click', function(){
                confirmPin(STATE.enteredPin);
            });
            $numbers.append($confirm);

            // Interface
            $element.data('keypad', {
                addToEnteredNumbers:	addToEnteredNumbers,
                backspaceOnPin: backspaceOnPin,
                clearPin:	clearPin
            });
            $(window).on('keydown', function(e){
                if ($element.hasClass('focus'))
                {
                    if (e.keyCode >= 48 && e.keyCode <= 57) {
                        let num = (e.keyCode - 48).toString();
                        addToEnteredNumbers(num);
                    } else
                    {
                        switch (e.keyCode) {
                            case 8:
                                backspaceOnPin();
                                break;
                            case 13:
                                confirmPin(STATE.enteredPin);
                                break;
                            default:
                                break;
                        }
                    }
                }
            });

            keypads = keypads.add($element);
        });
        return keypads;
    };

    $.fn.getKeypad = function(){
        return this.closest('.keypad');
    };

    $.fn.clear = function(){
        this.each(function()
        {
            var keypad = $(this).getKeypad(),
                data = (keypad.length > 0) ? keypad.data('keypad') : false;
            // If valid
            if (data)
            {
                data.clearPin();
            }
        });
        return this;
    };

    $.fn.addNumber = function(value){
        this.each(function()
        {
            var keypad = $(this).getKeypad(),
                data = (keypad.length > 0) ? keypad.data('keypad') : false;
            // If valid
            if (data)
            {
                data.addToEnteredNumbers(value);
            }
        });
        return this;
    };

    $.fn.keypad.defaults = {
        keys: [
            {num: 1, alpha: ""},
            {num: 2, alpha: "ABC"},
            {num: 3, alpha: "DEF"},
            {num: 4, alpha: "GHI"},
            {num: 5, alpha: "JKL"},
            {num: 6, alpha: "MNO"},
            {num: 7, alpha: "PQRS"},
            {num: 8, alpha: "TUV"},
            {num: 9, alpha: "WXYZ"},
            {num: 0, alpha: "+"},
        ]
    };

})(jQuery);
