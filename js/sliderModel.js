define([
  'core/js/adapt',
  'core/js/models/questionModel'
], function(Adapt, QuestionModel) {
  class SliderModel extends QuestionModel {

    init() {
      QuestionModel.prototype.init.call(this);

      this.setupModelItems();

      this.set('_selectedItem', this.get('_items')[0]);
    }

    /**
     * Returns the number of decimal places in a specified number
     */
    getDecimalPlaces(num) {
      return (num.toString().split('.')[1] || []).length;
    }

    setupModelItems() {
      const items = [];
      const answer = this.get('_correctAnswer');
      const range = this.get('_correctRange');
      const start = this.get('_scaleStart');
      const end = this.get('_scaleEnd');
      const step = this.get('_scaleStep') || 1;

      const dp = this.getDecimalPlaces(step);

      for (let i = start; i <= end; i += step) {
        if (dp !== 0) {
          // Ensure that steps with decimal places are handled correctly.
          i = parseFloat(i.toFixed(dp));
        }

        items.push({
          value: i,
          selected: false,
          // _correctAnswer/answer is a String - this allows AAT users to assign it no value when _correctRange needs to be used instead
          // we therefore need to convert it to Number when checking the answer (see https://github.com/adaptlearning/adapt_framework/issues/2259)
          correct: answer ? i === Number(answer) : (i >= range._bottom && i <= range._top)
        });
      }

      this.set({
        '_items': items,
        '_marginDir': Adapt.config.get('_defaultDirection') === 'rtl' ? 'right' : 'left'
      });
    }

    /**
    * allow the user to submit immediately; the slider handle may already be in the position they want to choose
    */
    canSubmit() {
      return true;
    }

    restoreUserAnswers() {
      if (!this.get('_isSubmitted')) {
        this.set({
          _selectedItem: {},
          _userAnswer: undefined
        });
        return;
      }

      const items = this.get('_items');
      const userAnswer = this.get('_userAnswer');
      for (let i = 0, l = items.length; i < l; i++) {
        const item = items[i];
        if (item.value === userAnswer) {
          item.selected = true;
          this.set('_selectedItem', item);
          break;
        }
      }

      this.setQuestionAsSubmitted();
      this.markQuestion();
      this.setScore();
      this.setupFeedback();
    }

    //This preserves the state of the users answers for returning or showing the users answer
    storeUserAnswer() {
      this.set('_userAnswer', this.get('_selectedItem').value);
    }

    resetUserAnswer() {
      this.set({
        _isAtLeastOneCorrectSelection: false,
        _selectedItem: {},
        _userAnswer: undefined
      });
    }

    deselectAllItems() {
      this.get('_items').forEach(item => {
        item.selected = false;
      });
    }

    isCorrect() {
      let numberOfCorrectAnswers = 0;

      this.get('_items').forEach(item => {
        if (item.selected && item.correct) {
          this.set('_isAtLeastOneCorrectSelection', true);
          numberOfCorrectAnswers++;
        }
      });

      this.set('_numberOfCorrectAnswers', numberOfCorrectAnswers);

      return this.get('_isAtLeastOneCorrectSelection') ? true : false;
    }

    isPartlyCorrect() {
      return this.get('_isAtLeastOneCorrectSelection');
    }

    // Used to set the score based upon the _questionWeight
    setScore() {
      const numberOfCorrectAnswers = this.get('_numberOfCorrectAnswers');
      const questionWeight = this.get('_questionWeight');
      const score = questionWeight * numberOfCorrectAnswers;
      this.set('_score', score);
    }

    /**
    * Used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
    */
    getResponse() {
      return this.get('_userAnswer').toString();
    }

    /**
    * Used by adapt-contrib-spoor to get the type of this question in the format required by the cmi.interactions.n.type data field
    */
    getResponseType() {
      return 'numeric';
    }

  };

  return SliderModel;

});
