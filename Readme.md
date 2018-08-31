# Simple Interactive Neural Network Visual

A basic visual that shows the up- and downstream influences on and by a single neuron in an artificial neural network. These connections are relevant in both feedforward and back propagation operations. 

Constructed using D3. See it in action as a [block](https://bl.ocks.org/laelcox/261849c07df68118853dd72e2a33a240).

Change the values in the variable array *neuronsPerLayer*, and the diagram will change to reflect the new neural network architecture. Hover over a neuron to see the neurons that influence it or are influenced by it.

Here's what's happening in the network (for the intermediate-advanced reader):

In a *feedforward* operation of a dense (aka fully connected) layer, a single neuron intakes all the activations of a previous layer and marries them up with its internal collection of weights and its bias to create a single, aggregated value. That's why you see a single neuron get influenced by all the neurons of the preceding layer.

That resulting value maps to a value on a new vector in multi-dimensional space, which in turn gets activated and *feeds* into all the neurons of the next layer, marrying up with their weights and bias. That's why a single neuron is connected to all the neurons on the following layer. 

While a single neuron has a direct connection with the neurons on the immediately preceding and following layers, its effect on layers further away is muddled and even diluted as more and more other neurons are also exerting their first and second-order effects. But it's still possible to measure the specific effect of a single neuron on the overall cost function. That's what *back propagation* does, moving backward along the same connecting paths.

First, a cost function (not shown here), compares the values from the prediction layer with the true outcomes of a set of training examples. Using the difference between the two as a measure of error, back propagation calculates a gradient that points toward an optimal lower error (cost). Back propagation then uses the chain-rule from calculus to incrementally hold things constant (using partial derivatives) and isolate the effect of a specific neuron and its weights and biases. Moving layer-by-layer, it passes back an accumulating (*composite* may be a better word) gradient that allows you to see how a single neuron needs to change to move the prediction toward the optimal prediction with the lowest cost.

During feedforward, a single neuron feeds into all the neurons of the subsequent layer. When working backward, that neuron is influenced by the gradients of all the neurons of the latter layer. From the perspective of back propagation, that's why you see a single neuron connected to all the neurons of the latter layer.

During feedforward, a single neuron is influenced by the activations of all the neurons of the previous layer. That means it also needs to pass the accumulating gradient effect back to each neuron of the preceding layer. One of the trickiest parts of back propagation is how a single neuron will take one of its weights (the one that marries up with a specific neuron of the previous layer) and pool its effect with the same specific weight of the other neurons in its layer. It's a bit of brilliance! Our neuron of interest has a weight for each of the previous layer's neuron activations, though, so it needs to pass its accumulating gradient to each of them. That's why you see a single neuron connected to all the neurons of its preceding layer.
