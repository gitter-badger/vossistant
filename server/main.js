Meteor.startup(() => {

  moment.locale('es');

  insertMessage = function(direction, text, responseTo) {

    if (responseTo) {
      return chat.update({_id: responseTo}, {
        $set: { response: text }
      });
    } else {
      return chat.insert({
        userId: Meteor.userId(),
        createdAt: new Date(),
        direction: direction,
        text: text
      });
    }

  }

  Meteor.methods({
    'inbound': function(text, textId) {

      // Make sure the user is logged in before inserting a task
      if (!this.userId) {
        throw new Meteor.Error('not-authorized');
      }

      var analysis = textRequest(text);

      if (!!analysis) {

        if (!!actions[analysis.intention]) {

          var action = actions[analysis.intention](analysis);

          if (!action) return false;

          if (!!action.command) {

            if (action.command.application === 'mongo') {
              Meteor.users.update({
                _id: Meteor.userId()
              }, {$set: action.command.parameters});
              delete action.command;
            } else {
              if (commands.execute(action, false)) {
                delete action.command;
              }
            }
          }

          if (!!action.text) {
            insertMessage('outbound', action.text, textId);
          }

          return action;
        }
      }

      return analysis;

    }
  });

});
