/*----------------------------------------------------------------------*/
/* Observable Extention for Editing
 /*----------------------------------------------------------------------*/
ko.observable.fn.beginEdit = function (transaction) {

    var self = this;
    var commitSubscription,
        rollbackSubscription;

    // get the current value and store it for editing
    if (self.slice)
        self.editValue = ko.observableArray(self.slice());
    else
        self.editValue = ko.observable(self());

    self.dispose = function () {
        // kill this subscriptions
        commitSubscription.dispose();
        rollbackSubscription.dispose();
    };

    self.commit = function () {
        // update the actual value with the edit value
        self(self.editValue());

        // dispose the subscriptions
        self.dispose();
    };

    self.rollback = function () {
        // rollback the edit value
        self.editValue(self());

        // dispose the subscriptions
        self.dispose();
    };

    //  subscribe to the transation commit and reject calls
    commitSubscription = transaction.subscribe(self.commit,
        self,
        "commit");

    rollbackSubscription = transaction.subscribe(self.rollback,
        self,
        "rollback");

    return self;
}

/*----------------------------------------------------------------------*/
/* Item Model
 /*----------------------------------------------------------------------*/

function Fruit( name, colour) {
    var self = this;
    self.name = ko.observable(name);
    self.colour = ko.observable(colour);
};

Fruit.prototype.beginEdit = function(transaction) {
    this.name.beginEdit(transaction);
    this.colour.beginEdit(transaction);
}


/*----------------------------------------------------------------------*/
/* View Model
 /*----------------------------------------------------------------------*/
function FruitColourViewModel() {
    var self = this;

    //  data
    self.availableColours = [];
    self.fruits = ko.observableArray([]);
    self.editingItem = ko.observable();

    //  create the transaction for commit and reject
    self.editTransaction = new ko.subscribable();

    //  helpers
    self.isItemEditing = function(fruit) {
        return fruit == self.editingItem();
    };

    //  behaviour
    self.addFruit = function () {
        var fruit = new Fruit("New fruit", self.availableColours[0]);
        self.fruits.push(fruit);

        //  begin editing the new item straight away
        self.editFruit(fruit);
    };

    self.removeFruit = function (fruit) {
        if (self.editingItem() == null) {
            var answer = true; // confirm('Are you sure you want to delete this fruit? ' + fruit.name());
            if (answer) {
                self.fruits.remove(fruit)
            }
        }
    };

    self.editFruit = function (fruit) {
        if (self.editingItem() == null) {
            // start the transaction
            fruit.beginEdit(self.editTransaction);

            // shows the edit fields
            self.editingItem(fruit);
        }
    };

    self.applyFruit = function (fruit) {
        //  commit the edit transaction
        self.editTransaction.notifySubscribers(null, "commit");

        //  hides the edit fields
        self.editingItem(null);
    };

    self.cancelEdit = function (fruit) {
        //  reject the edit transaction
        self.editTransaction.notifySubscribers(null, "rollback");

        //  hides the edit fields
        self.editingItem(null);
    };

}

/*----------------------------------------------------------------------*/
/* KO Page Binding                                                      */
/*----------------------------------------------------------------------*/
$(document).ready(function() {

    //  create the model
    var model = new FruitColourViewModel();
    model.availableColours = ["Blue", "Green", "Orange", "Red", "Yellow"];

    var initData = [
        new Fruit( "Apple", "Green"),
        new Fruit( "Banana", "Yellow"),
        new Fruit( "Orange", "Orange"),
        new Fruit( "Strawberry", "Red")
    ];

    model.fruits(initData);

    //  bind model to the html
    ko.applyBindings( model );

});


